import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# ============================================
# DATABASE URL
# ============================================

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./decision.db"
)

# Railway/Render MySQL fix

if DATABASE_URL.startswith("mysql://"):
    DATABASE_URL = DATABASE_URL.replace(
        "mysql://",
        "mysql+pymysql://",
        1
    )

# SQLite special config

connect_args = (
    {"check_same_thread": False}
    if DATABASE_URL.startswith("sqlite")
    else {}
)

# ============================================
# ENGINE
# ============================================

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
)

# ============================================
# SESSION
# ============================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# ============================================
# BASE MODEL
# ============================================

Base = declarative_base()

# ============================================
# DATABASE DEPENDENCY
# ============================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()