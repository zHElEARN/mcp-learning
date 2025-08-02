from fastapi import APIRouter

from services.client_service import client_provider

router = APIRouter(prefix="/models")


@router.get("/")
async def get_models():
    return client_provider.get_models()
