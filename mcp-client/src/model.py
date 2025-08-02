from pydantic import BaseModel


class BaseModelWithConfig(BaseModel):
    class Config:
        populate_by_name = True
        alias_generator = lambda field_name: "".join(
            word.capitalize() if i > 0 else word
            for i, word in enumerate(field_name.split("_"))
        )
