from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.database import engine, Base

# Import all models so SQLAlchemy creates tables
from app.models.decision import (
    Decision,
    Criterion,
    Comparison,
    Option,
    Rating,
)

from app.routers import decisions

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Decision Intelligence API",
    version="1.0.0",
)

# ============================================
# CORS
# ============================================

origins = [
    "http://localhost:3000",
    "https://localhost:3000",
    "http://127.0.0.1:3000",
    "https://127.0.0.1:3000",
]

# Production frontend URL
frontend_url = os.getenv("FRONTEND_URL")

if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# ROUTERS
# ============================================

app.include_router(decisions.router)

# ============================================
# ROOT
# ============================================

@app.get("/")
def root():
    return {
        "message": "Decision Intelligence API is running ✅"
    }

# ============================================
# HEALTH CHECK
# ============================================

@app.get("/health")
def health():
    return {
        "status": "ok"
    }