from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base

# Import all models so SQLAlchemy creates their tables
from app.models.decision import Decision, Criterion, Comparison, Option, Rating
from app.routers import decisions

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Decision Intelligence API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(decisions.router)

@app.get("/")
def root():
    return {"message": "Decision Intelligence API is running ✅"}

@app.get("/health")
def health():
    return {"status": "ok"}