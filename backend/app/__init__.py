# app/__init__.py

from fastapi import FastAPI

app = FastAPI()

from .routes import auth, users

app.include_router(auth.router)
app.include_router(users.router)