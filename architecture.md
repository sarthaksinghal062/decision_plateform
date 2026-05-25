# System Architecture

## Frontend Flow

User Input
↓
Zustand Store
↓
API Layer (`src/lib/api.ts`)
↓
FastAPI Backend
↓
Database

---

# Frontend Architecture

src/
├── app/                → Next.js routes/pages
├── components/         → Reusable UI components
├── lib/                → API utilities/helpers
├── store/              → Zustand state management

---

# Backend Architecture

backend/app/
├── routers/            → API endpoints
├── models/             → SQLAlchemy database models
├── schemas/            → Pydantic request/response models
├── services/           → Business logic
├── config.py           → App configuration
├── database.py         → DB connection
└── main.py             → FastAPI entrypoint

---

# Current User Flow

Homepage
→ Create Decision
→ Add Criteria
→ Add Options
→ Compare Results
→ AI Recommendation
