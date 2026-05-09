### routers/swap.py ###
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas import SwapCondition, SwapResponse
from services.swap_engine import run_swap_analysis

router = APIRouter(prefix="/users/{user_id}/swap", tags=["SWAP 추천"])


@router.post("/analyze", response_model=SwapResponse)
def analyze_swap(
    user_id: int,
    condition: SwapCondition,
    year: int,
    month: int,
    db: Session = Depends(get_db)
):
    """
    유저 조건 입력 → 최적 요금제/카드 조합 추천
    - condition: 원하는 OTT, 도서 서비스, 예산, K-패스 여부 등
    - year/month: 분석 기준 월
    """
    return run_swap_analysis(db, user_id, condition, year, month)


### routers/notifications.py ###
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas import NotificationItem
from services.notification_engine import get_all_notifications, check_renewal_decision
from typing import List

router = APIRouter(prefix="/users/{user_id}/notifications", tags=["알림"])


@router.get("/", response_model=List[NotificationItem])
def get_notifications(
    user_id: int,
    year: int,
    month: int,
    current_swap_savings: float = 0,
    db: Session = Depends(get_db)
):
    """현재 발송해야 할 알림 목록 조회"""
    return get_all_notifications(db, user_id, year, month, current_swap_savings)


@router.get("/renewal-decision/{subscription_id}", response_model=NotificationItem)
def get_renewal_decision(
    user_id: int,
    subscription_id: int,
    year: int,
    month: int,
    db: Session = Depends(get_db)
):
    """
    구독 만기 시 당월 지출 분석 → 연장/해지 추천
    """
    return check_renewal_decision(db, user_id, subscription_id, year, month)
