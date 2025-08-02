import json
from contextlib import AsyncExitStack

from mcp import ClientSession, StdioServerParameters, stdio_client
from openai import OpenAI


class MCPClient:
    def __init__(self, mcp_config: dict):
        self.client_sessions: dict[str, ClientSession] = {}
        self.mcp_config = mcp_config
        self.exit_stack = AsyncExitStack()

    async def connect_to_servers(self):
        for server_name in self.mcp_config["mcpServers"]:
            await self.connect_to_server(server_name)

    async def connect_to_server(self, server_name: str):
        server_config = self.mcp_config["mcpServers"][server_name]

        server_params = StdioServerParameters(
            command=server_config["command"],
            args=server_config["args"],
            env=server_config.get("env", {}),
        )
        stdio_transport = await self.exit_stack.enter_async_context(
            stdio_client(server_params)
        )
        stdio, write = stdio_transport
        session = await self.exit_stack.enter_async_context(ClientSession(stdio, write))

        await session.initialize()
        self.client_sessions[server_name] = session

    async def process_query_stream(
        self, messages: list, new_messages: list, client_and_model: tuple[OpenAI, str]
    ):
        finished: bool = False
        thinking: bool = False
        contenting: bool = False
        tool_calling: bool = False

        tool_call_arguments: str = ""
        tool_call_server: str = ""
        tool_call_name: str = ""
        tool_call_id: str = ""
        message_content: str = ""

        available_tools = []
        for server_name, session in self.client_sessions.items():
            tools = (await session.list_tools()).tools
            available_tools.extend(
                [
                    {
                        "type": "function",
                        "function": {
                            "name": f"{server_name}:{tool.name}",
                            "description": tool.description,
                            "parameters": getattr(
                                tool,
                                "inputSchema",
                                {"type": "object", "properties": {}, "required": []},
                            ),
                        },
                    }
                    for tool in tools
                ]
            )

        client, model_name = client_and_model
        model_stream = client.chat.completions.create(
            model=model_name,
            messages=messages,
            tools=available_tools,
            stream=True,
        )

        while not finished:
            for chunk in model_stream:
                choice = chunk.choices[0]
                delta = choice.delta

                if hasattr(delta, "reasoning_content") and delta.reasoning_content:
                    if not thinking:
                        yield "\n\n<thinking-block>\n\n"
                        thinking = True
                    yield delta.reasoning_content
                else:
                    if thinking:
                        yield "\n\n</thinking-block>\n\n"
                        thinking = False

                if delta.content and delta.content.strip():
                    if not contenting:
                        contenting = True
                    message_content += delta.content
                    yield delta.content
                else:
                    if contenting:
                        contenting = False

                if delta.tool_calls:
                    tool_call = delta.tool_calls[0]
                    tool_call_function = tool_call.function
                    if tool_call.id != "":
                        tool_call_id = tool_call.id
                        if tool_call_function.name != None:
                            name = tool_call_function.name
                            parts = name.split(":")
                            tool_call_server = parts[0]
                            tool_call_name = parts[1]

                        yield f"\n\n<tool-block tool='{tool_call_name}' server='{tool_call_server}'>\n"

                    if tool_call_function.arguments != None:
                        if not tool_calling:
                            yield "<tool-args>"
                            tool_calling = True
                        args = tool_call.function.arguments
                        yield args
                        tool_call_arguments += args

                if choice.finish_reason == "stop":
                    message = {
                        "role": "assistant",
                        "content": message_content,
                    }
                    new_messages.append(message)
                    messages.append(message)
                    finished = True
                    break

                if choice.finish_reason == "tool_calls":
                    if tool_calling:
                        yield "</tool-args>"
                        tool_calling = False

                    params = json.loads(tool_call_arguments)
                    result = await self.client_sessions[tool_call_server].call_tool(
                        tool_call_name, params
                    )
                    yield "\n<tool-result>"
                    yield result.model_dump_json()
                    yield "</tool-result>\n"
                    yield "</tool-block>\n\n"

                    message = {
                        "role": "assistant",
                        "tool_calls": [
                            {
                                "id": tool_call_id,
                                "function": {
                                    "name": f"{tool_call_server}:{tool_call_name}",
                                    "arguments": tool_call_arguments,
                                },
                                "type": "function",
                            }
                        ],
                    }

                    if message_content != "":
                        message["content"] = message_content

                    tool_message = {
                        "role": "tool",
                        "content": result.model_dump().get("content", ""),
                        "tool_call_id": tool_call_id,
                    }

                    new_messages.extend([message, tool_message])
                    messages.extend([message, tool_message])

                    tool_call_arguments = ""
                    message_content = ""

                    model_stream = client.chat.completions.create(
                        model=model_name,
                        messages=messages,
                        tools=available_tools,
                        stream=True,
                    )
                    break

            else:
                break

    async def cleanup(self):
        await self.exit_stack.aclose()
