# Decision Helper

A structured decision-making platform that helps you make confident choices using **weighted scoring and pairwise comparisons** (AHP — Analytic Hierarchy Process).

![Decision Helper](https://img.shields.io/badge/status-MVP-blue) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![FastAPI](https://img.shields.io/badge/FastAPI-Python-green)

## What it does

Instead of guessing, Decision Helper walks you through a structured 3-step process:

1. **Define factors** — Add what matters (Price, Battery, Performance...)
2. **Compare factors** — Answer "which matters more?" to calculate weights automatically
3. **Rate options** — Score each option 1–10 per factor, get a ranked result with charts

**Example:** "Best laptop under ₹80,000" → compares MacBook Air vs Dell XPS vs Lenovo Legion → returns weighted scores with bar chart, radar chart, and explanation.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, Recharts |
| Backend | FastAPI, Python 3.11, SQLAlchemy |
| Database | SQLite (dev) → PostgreSQL (prod) |
| State | Zustand with localStorage persistence |

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+

### Backend
```bash
cd backend
python -m venv venv
source venv/Scripts/activate   # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```
API runs at `http://127.0.0.1:8000`  
Swagger docs at `http://127.0.0.1:8000/docs`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App runs at `http://localhost:3000`

### Environment Variables

`backend/.env`
```
DATABASE_URL=sqlite:///./decision.db
APP_ENV=development
```

`frontend/.env.local`
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## API Overview

```
POST   /api/decisions                       Create decision
GET    /api/decisions                       List all decisions
GET    /api/decisions/{id}                  Get decision
POST   /api/decisions/{id}/criteria         Save factors
POST   /api/decisions/{id}/comparisons      Save pairwise answers
POST   /api/decisions/{id}/calculate-weights  Run AHP math
POST   /api/decisions/{id}/options          Save options
POST   /api/decisions/{id}/ratings          Save ratings
GET    /api/decisions/{id}/results          Get ranked results
```

## Project Structure

```
decision-platform/
├── backend/
│   └── app/
│       ├── main.py          # FastAPI entry point
│       ├── database.py      # SQLAlchemy setup
│       ├── models/          # DB table definitions
│       ├── schemas/         # Pydantic models
│       ├── routers/         # API route handlers
│       └── services/        # AHP math, scoring
└── frontend/
    └── src/
        ├── app/             # Next.js pages
        ├── components/      # Reusable UI components
        ├── lib/             # API client, TypeScript types
        └── store/           # Zustand state
```

## Roadmap

- [x] Core AHP decision flow
- [x] Pairwise comparison wizard
- [x] Weighted scoring engine
- [x] Results with charts
- [x] Decision history dashboard
- [ ] Dark mode
- [ ] AI-powered criteria suggestions
- [ ] Export as PDF
- [ ] User accounts
- [ ] Deploy to production

## License

MIT
