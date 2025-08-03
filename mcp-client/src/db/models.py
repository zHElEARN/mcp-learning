import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Column, DateTime, func
from sqlalchemy.dialects.postgresql import JSON
from sqlmodel import Field, Relationship, SQLModel


class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: Optional[str] = Field(default=None)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(
            DateTime(timezone=True), nullable=False, server_default=func.now()
        ),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
            onupdate=func.now(),
        ),
    )

    messages: list["Message"] = Relationship(back_populates="conversation")
    raw_messages: list["RawMessage"] = Relationship(back_populates="conversation")


class RawMessage(SQLModel, table=True):
    __tablename__ = "raw_messages"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    payload: dict = Field(sa_type=JSON, nullable=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(
            DateTime(timezone=True), nullable=False, server_default=func.now()
        ),
    )

    conversation_id: uuid.UUID = Field(foreign_key="conversations.id", nullable=False)
    conversation: Conversation = Relationship(back_populates="raw_messages")


class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    role: str = Field(nullable=False)
    content: str = Field(nullable=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(
            DateTime(timezone=True), nullable=False, server_default=func.now()
        ),
    )

    conversation_id: uuid.UUID = Field(foreign_key="conversations.id", nullable=False)
    conversation: Conversation = Relationship(back_populates="messages")
