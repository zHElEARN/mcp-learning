import json
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select

from db.db import get_session
from db.models import Conversation, Message, RawMessage
from model import BaseModelWithConfig
from services.client_service import client_provider
from services.mcp_service import mcp_client

router = APIRouter(prefix="/conversations")


class QueryModel(BaseModelWithConfig):
    query: str
    model_name: str


class ConversationCreate(BaseModelWithConfig):
    title: str


class ConversationResponse(BaseModelWithConfig):
    id: uuid.UUID
    title: Optional[str]
    created_at: str
    updated_at: str


class MessageResponse(BaseModelWithConfig):
    id: uuid.UUID
    role: str
    content: str
    created_at: str


class RawMessageResponse(BaseModelWithConfig):
    id: uuid.UUID
    payload: dict
    created_at: str


class ConversationDetailResponse(ConversationResponse):
    messages: list[MessageResponse]


@router.get("/", response_model=list[ConversationResponse])
async def get_all_conversations(
    session: Session = Depends(get_session),
) -> list[ConversationResponse]:
    conversations = session.exec(
        select(Conversation).order_by(Conversation.updated_at.desc())
    ).all()
    return [
        ConversationResponse(
            id=conv.id,
            title=conv.title,
            created_at=conv.created_at.isoformat(),
            updated_at=conv.updated_at.isoformat(),
        )
        for conv in conversations
    ]


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation_with_messages(
    conversation_id: uuid.UUID, session: Session = Depends(get_session)
) -> ConversationDetailResponse:
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="会话不存在")

    messages = session.exec(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    ).all()

    return ConversationDetailResponse(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at.isoformat(),
        updated_at=conversation.updated_at.isoformat(),
        messages=[
            MessageResponse(
                id=msg.id,
                role=msg.role,
                content=msg.content,
                created_at=msg.created_at.isoformat(),
            )
            for msg in messages
        ],
    )


@router.post("/", response_model=ConversationResponse)
async def create_conversation(
    conversation_data: ConversationCreate, session: Session = Depends(get_session)
) -> ConversationResponse:
    conversation = Conversation(title=conversation_data.title)
    session.add(conversation)
    session.commit()
    session.refresh(conversation)

    return ConversationResponse(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at.isoformat(),
        updated_at=conversation.updated_at.isoformat(),
    )


@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: uuid.UUID, session: Session = Depends(get_session)
):
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="会话不存在")

    messages = session.exec(
        select(Message).where(Message.conversation_id == conversation_id)
    ).all()
    raw_messages = session.exec(
        select(RawMessage).where(RawMessage.conversation_id == conversation_id)
    ).all()

    for msg in messages:
        session.delete(msg)
    for raw_msg in raw_messages:
        session.delete(raw_msg)

    session.delete(conversation)
    session.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{conversation_id}/chat")
async def chat(
    conversation_id: uuid.UUID,
    query: QueryModel,
    session: Session = Depends(get_session),
):
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="会话不存在")

    if query.model_name not in client_provider.get_models():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"模型 {query.model_name} 不可用",
        )

    raw_messages = session.exec(
        select(RawMessage)
        .where(RawMessage.conversation_id == conversation_id)
        .order_by(RawMessage.created_at.asc())
    ).all()

    messages = [raw_message.payload for raw_message in raw_messages]

    user_message = {"role": "user", "content": query.query}

    messages.append(user_message)
    new_messages = [user_message]

    async def event_stream():
        complete_content = ""

        async for chunk in mcp_client.process_query_stream(
            messages,
            new_messages,
            client_provider.get_client_and_model(query.model_name),
        ):
            yield f"data: {json.dumps({'content': chunk})}\n\n"
            complete_content += chunk

        new_raw_messages = [
            RawMessage(
                conversation_id=conversation_id,
                payload=message,
            )
            for message in new_messages
        ]
        session.add_all(new_raw_messages)

        session.add_all(
            [
                Message(
                    conversation_id=conversation_id,
                    role="user",
                    content=query.query,
                ),
                Message(
                    conversation_id=conversation_id,
                    role="assistant",
                    content=complete_content,
                ),
            ]
        )

        session.commit()

    return StreamingResponse(content=event_stream(), media_type="text/event-stream")
