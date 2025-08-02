from openai import OpenAI


class ClientProvider:
    def __init__(self, client_config: dict):
        config = client_config.get("providers", {})
        self.clients = {}

        self.models: list[str] = []

        for provider, config in config.items():
            base_url = config.get("base_url", "")
            api_key = config.get("api_key", "")
            self.clients[provider] = OpenAI(api_key=api_key, base_url=base_url)

            models = config.get("models", [])
            for model in models:
                self.models.append(f"{provider}.{model}")

    def get_models(self) -> list[str]:
        return self.models

    def get_client(self, provider: str) -> OpenAI:
        if provider in self.clients:
            return self.clients[provider]
        else:
            raise ValueError(f"Client for provider '{provider}' not found.")

    def get_client_and_model(self, model: str) -> tuple[OpenAI, str]:
        provider, model_name = model.split(".", 1)
        client = self.get_client(provider)
        return client, model_name
