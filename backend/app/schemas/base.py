from pydantic import BaseModel, ConfigDict

class ORMBaseModel(BaseModel):
    """
    Standard base model for all API response schemas in WorkForce AI Pro.
    Enables automatic attribute reading from SQLAlchemy ORM objects.
    """
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)
