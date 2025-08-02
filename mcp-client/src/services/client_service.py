import json

from client_provider import ClientProvider

with open("model_config.json", "r") as file:
    model_config = json.load(file)
client_provider = ClientProvider(model_config)
