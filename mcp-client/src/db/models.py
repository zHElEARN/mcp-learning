import datetime
import uuid
from typing import Optional

from sqlalchemy import event
from sqlalchemy.dialects.postgresql import JSON
from sqlmodel import Field, Relationship, SQLModel


class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: Optional[str] = Field(default=None)

    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc)
    )
    updated_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc),
        sa_column_kwargs={
            "onupdate": lambda: datetime.datetime.now(datetime.timezone.utc)
        },
    )

    messages: list["Message"] = Relationship(back_populates="conversation")
    raw_messages: list["RawMessage"] = Relationship(back_populates="conversation")


class RawMessage(SQLModel, table=True):
    __tablename__ = "raw_messages"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    payload: dict = Field(sa_type=JSON, nullable=False)
    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc)
    )

    conversation_id: uuid.UUID = Field(foreign_key="conversations.id", nullable=False)
    conversation: Conversation = Relationship(back_populates="raw_messages")


class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    role: str = Field(nullable=False)
    content: str = Field(nullable=False)
    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc)
    )

    conversation_id: uuid.UUID = Field(foreign_key="conversations.id", nullable=False)
    conversation: Conversation = Relationship(back_populates="messages")
