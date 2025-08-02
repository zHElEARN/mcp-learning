import os
from typing import Literal

import requests
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

load_dotenv()

mcp = FastMCP("webhook-helper")

api_key = os.environ.get("API_KEY")


@mcp.tool()
def send_message(
    chat_type: Literal["group", "private"], chat_number: str, message: str
) -> None:
    """向用户推送信息

    Args:
        chat_type (Literal["group", "private"]): 聊天类型，"group" 或 "private"
        chat_number (str): 聊天号码或用户 ID
        message (str): 要发送的消息内容
    """
    body = {
        "message": message,
    }

    response = requests.post(
        f"https://webhook.zhelearn.com/webhook/custom/{api_key}?chat_type={chat_type}&chat_number={chat_number}",
        json=body,
    )
    response.raise_for_status()


if __name__ == "__main__":
    mcp.run(transport="stdio")
