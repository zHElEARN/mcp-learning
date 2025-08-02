from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel

from db.db import engine
from routers.conversations import router as conversation_router
from routers.models import router as model_router
from services.mcp_service import mcp_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        SQLModel.metadata.create_all(engine)

        await mcp_client.connect_to_servers()
        yield
    finally:
        await mcp_client.cleanup()


def create_app() -> FastAPI:
    app = FastAPI(lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(conversation_router)
    app.include_router(model_router)

    return app


app = create_app()

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=5678)
