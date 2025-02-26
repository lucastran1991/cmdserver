import json
import os

from fastapi import FastAPI
from app.routes import command
from fastapi.middleware.cors import CORSMiddleware
from app.routes.session import router as session_router
from app.routes.session import users_router

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

# Import and include the routers
app.include_router(command.router)
app.include_router(session_router)
app.include_router(command.router)
app.include_router(session_router, prefix="/auth", tags=["auth"])
app.include_router(users_router, prefix="/users", tags=["users"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Command Server API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=config["host"], port=config["port"])