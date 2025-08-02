import asyncio
import json
import logging

import rich
from openai import OpenAI

from client_provider import ClientProvider
from mcp_client import MCPClient

logging.disable(logging.CRITICAL)


query = """
先帮我分析这段文本和关键词之间的相关性：
```
keywords = ["What is BGE M3?", "Defination of BM25"]
sentences = ["BGE M3 is an embedding model supporting dense retrieval, lexical matching and multi-vector interaction.", "BM25 is a bag-of-words retrieval function that ranks a set of documents based on the query terms appearing in each document"]
```
分析完以上文本后先告诉我结果，再继续以下的部分

再帮我分析`boy`和`girl`两个文本之间的相关性

然后将相关性分析结果绘制一个图表给我
"""


async def main():
    with open("mcp_config.json", "r") as file:
        mcp_config = json.load(file)
    mcp_client = MCPClient(mcp_config)

    with open("model_config.json", "r") as file:
        model_config = json.load(file)
    client_provider = ClientProvider(model_config)

    try:
        await mcp_client.connect_to_servers()

        messages = [{"role": "user", "content": query}]
        new_messages = []

        async for chunk in mcp_client.process_query_stream(
            messages,
            new_messages,
            client_provider.get_client_and_model("aliyun.qwen-plus"),
        ):
            print(chunk, end="", flush=True)
    finally:
        await mcp_client.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
