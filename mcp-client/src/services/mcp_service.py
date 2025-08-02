import json

from mcp_client import MCPClient

with open("mcp_config.json", "r") as file:
    mcp_config = json.load(file)
mcp_client = MCPClient(mcp_config)
