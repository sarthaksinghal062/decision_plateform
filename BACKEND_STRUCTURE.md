# Backend Structure

## models/

Database models using SQLAlchemy

### decision.py

Decision table model

---

# routers/

FastAPI route definitions

### decisions.py

Decision API routes

---

# schemas/

Pydantic validation schemas

### decision.py

Request and response validation

---

# services/

Business logic layer

### scoring.py

Decision scoring calculations

### ai.py

AI recommendation logic

---

# Core Files

## database.py

Database connection/session setup

## config.py

Environment variables and configuration

## main.py

FastAPI application entrypoint
