from pydantic import BaseModel
from datetime import date

class User(BaseModel):
    username: str
    firstname: str
    lastname: str
    id: int
    dateOfBirth: date