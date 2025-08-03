from fastapi import APIRouter

from services.mcp_service import mcp_client

router = APIRouter(prefix="/tools")


@router.get("/", response_model=list[str])
async def get_tools():
    return await mcp_client.get_tools()
