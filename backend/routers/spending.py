### routers/spending.py ###
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Spending
from schemas import SpendingCreate, SpendingOut, SpendingSummary
from services.swap_engine import get_spending_by_category
from typing import List

router = APIRouter(prefix="/users/{user_id}/spending", tags=["지출 관리"])


@router.post("/", response_model=SpendingOut)
def add_spending(user_id: int, body: SpendingCreate, db: Session = Depends(get_db)):
    record = Spending(user_id=user_id, **body.dict())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/summary", response_model=SpendingSummary)
def get_spending_summary(
    user_id: int,
    year: int,
    month: int,
    db: Session = Depends(get_db)
):
    current = get_spending_by_category(db, user_id, year, month)
    total = sum(current.values())

    # 전월 비교
    prev_month = month - 1 if month > 1 else 12
    prev_year = year if month > 1 else year - 1
    prev = get_spending_by_category(db, user_id, prev_year, prev_month)
    prev_total = sum(prev.values())

    vs_last = total - prev_total if prev_total > 0 else None

    return SpendingSummary(
        year=year,
        month=month,
        by_category={k.value: v for k, v in current.items()},
        total=total,
        vs_last_month=vs_last,
    )
