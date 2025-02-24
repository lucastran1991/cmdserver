import json
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, users

config_path = os.path.join(os.path.dirname(__file__), "../../config.json")
with open(config_path) as config_file:
    config = json.load(config_file)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=config["host"], port=config["port"])