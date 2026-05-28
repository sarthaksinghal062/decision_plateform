from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.decision import Decision, Criterion, Comparison as ComparisonModel, Option, Rating
from app.schemas.decision import DecisionCreate, DecisionResponse
import uuid
import numpy as np

router = APIRouter(prefix="/api/decisions", tags=["decisions"])

SCALE_MAP = {
    "equal": 1.0,
    "slightly": 2.0,
    "moderately": 3.0,
    "strongly": 5.0,
    "extremely": 7.0,
}


# ─── Decisions ────────────────────────────────────────────────────────────────

@router.get("", response_model=list[DecisionResponse])
def list_decisions(db: Session = Depends(get_db)):
    """List all decisions for the dashboard."""
    return db.query(Decision).order_by(Decision.created_at.desc()).all()


@router.post("", response_model=DecisionResponse)
def create_decision(payload: DecisionCreate, db: Session = Depends(get_db)):
    decision = Decision(
        id=str(uuid.uuid4()),
        title=payload.title,
        status="draft"
    )
    db.add(decision)
    db.commit()
    db.refresh(decision)
    return decision


@router.get("/{decision_id}", response_model=DecisionResponse)
def get_decision(decision_id: str, db: Session = Depends(get_db)):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision


@router.delete("/{decision_id}")
def delete_decision(decision_id: str, db: Session = Depends(get_db)):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    db.delete(decision)
    db.commit()
    return {"status": "deleted"}


# ─── Criteria ─────────────────────────────────────────────────────────────────

@router.post("/{decision_id}/criteria")
def save_criteria(decision_id: str, payload: dict, db: Session = Depends(get_db)):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    db.query(Criterion).filter(Criterion.decision_id == decision_id).delete()

    criteria = []
    for i, name in enumerate(payload["names"]):
        c = Criterion(
            id=str(uuid.uuid4()),
            decision_id=decision_id,
            name=name,
            position=i
        )
        db.add(c)
        criteria.append({
            "id": c.id,
            "name": c.name,
            "position": c.position,
            "decision_id": decision_id
        })

    decision.status = "comparing"
    db.commit()
    return criteria


# ─── Comparisons & Weights ────────────────────────────────────────────────────

@router.post("/{decision_id}/comparisons")
def save_comparisons(decision_id: str, payload: dict, db: Session = Depends(get_db)):
    db.query(ComparisonModel).filter(
        ComparisonModel.decision_id == decision_id
    ).delete()

    for comp in payload["comparisons"]:
        c = ComparisonModel(
            id=str(uuid.uuid4()),
            decision_id=decision_id,
            criterion_a=comp["criterion_a"],
            criterion_b=comp["criterion_b"],
            winner=comp["winner"],
            value=SCALE_MAP.get(comp["preference"], 1.0),
        )
        db.add(c)

    db.commit()
    return {"status": "saved"}


@router.post("/{decision_id}/calculate-weights")
def calculate_weights(decision_id: str, db: Session = Depends(get_db)):
    criteria = db.query(Criterion).filter(
        Criterion.decision_id == decision_id
    ).order_by(Criterion.position).all()

    comparisons = db.query(ComparisonModel).filter(
        ComparisonModel.decision_id == decision_id
    ).all()

    n = len(criteria)
    if n == 0:
        raise HTTPException(status_code=400, detail="No criteria found")

    idx = {c.id: i for i, c in enumerate(criteria)}
    matrix = [[1.0] * n for _ in range(n)]

    for comp in comparisons:
        i = idx.get(comp.criterion_a)
        j = idx.get(comp.criterion_b)
        if i is None or j is None:
            continue
        if comp.winner == comp.criterion_a:
            matrix[i][j] = comp.value
            matrix[j][i] = 1.0 / comp.value
        else:
            matrix[j][i] = comp.value
            matrix[i][j] = 1.0 / comp.value

    mat = np.array(matrix)
    col_sums = mat.sum(axis=0)
    normalized = mat / col_sums
    weights = normalized.mean(axis=1)

    for i, c in enumerate(criteria):
        c.weight = round(float(weights[i]), 4)

    db.commit()
    return [{"id": c.id, "name": c.name, "weight": c.weight} for c in criteria]


# ─── Options & Ratings ────────────────────────────────────────────────────────

@router.post("/{decision_id}/options")
def save_options(decision_id: str, payload: dict, db: Session = Depends(get_db)):
    db.query(Option).filter(Option.decision_id == decision_id).delete()

    options = []
    for name in payload["names"]:
        o = Option(
            id=str(uuid.uuid4()),
            decision_id=decision_id,
            name=name
        )
        db.add(o)
        options.append({"id": o.id, "name": o.name, "decision_id": decision_id})

    db.commit()
    return options


@router.post("/{decision_id}/ratings")
def save_ratings(decision_id: str, payload: dict, db: Session = Depends(get_db)):
    for r in payload["ratings"]:
        existing = db.query(Rating).filter(
            Rating.option_id == r["option_id"],
            Rating.criterion_id == r["criterion_id"]
        ).first()
        if existing:
            existing.score = r["score"]
        else:
            db.add(Rating(
                id=str(uuid.uuid4()),
                option_id=r["option_id"],
                criterion_id=r["criterion_id"],
                score=r["score"]
            ))
    db.commit()
    return {"status": "saved"}


# ─── Results ──────────────────────────────────────────────────────────────────

@router.get("/{decision_id}/results")
def get_results(decision_id: str, db: Session = Depends(get_db)):
    criteria = db.query(Criterion).filter(
        Criterion.decision_id == decision_id
    ).all()

    options = db.query(Option).filter(
        Option.decision_id == decision_id
    ).all()

    if not criteria or not options:
        raise HTTPException(status_code=404, detail="No criteria or options found")

    weights = {c.id: (c.weight or 0) for c in criteria}
    results = []

    for opt in options:
        ratings = db.query(Rating).filter(Rating.option_id == opt.id).all()
        breakdown = {r.criterion_id: r.score for r in ratings}
        score = sum(weights.get(cid, 0) * s for cid, s in breakdown.items())
        results.append({
            "option_id": opt.id,
            "name": opt.name,
            "score": round(score, 3),
            "breakdown": breakdown,
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    if results:
        results[0]["is_winner"] = True

    # Update decision status to complete
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if decision:
        decision.status = "complete"
        db.commit()

    return {
        "winner": results[0] if results else None,
        "ranking": results,
        "weights": [
            {"criterion": c.name, "criterion_id": c.id, "weight": c.weight}
            for c in criteria
        ],
    }
