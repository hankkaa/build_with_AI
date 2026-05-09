from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from models import CategoryEnum


# ── User ──────────────────────────────────────────────
class UserCreate(BaseModel):
    name: str
    region: Optional[str] = None
    notify_days_before: int = 7
    notify_min_savings: int = 5000

class UserOut(UserCreate):
    id: int
    class Config:
        from_attributes = True


# ── Subscription ──────────────────────────────────────
class SubscriptionCreate(BaseModel):
    name: str
    category: CategoryEnum
    monthly_cost: float
    renewal_date: date

class SubscriptionOut(SubscriptionCreate):
    id: int
    is_active: bool
    days_until_renewal: Optional[int] = None
    class Config:
        from_attributes = True


# ── Spending ──────────────────────────────────────────
class SpendingCreate(BaseModel):
    category: CategoryEnum
    amount: float
    description: Optional[str] = None
    year: int
    month: int

class SpendingOut(SpendingCreate):
    id: int
    class Config:
        from_attributes = True

class SpendingSummary(BaseModel):
    """카테고리별 지출 요약"""
    year: int
    month: int
    by_category: dict[str, float]
    total: float
    vs_last_month: Optional[float] = None  # 전월 대비 증감


# ── Swap ──────────────────────────────────────────────
class SwapCondition(BaseModel):
    """유저가 원하는 조건"""
    include_ott: Optional[List[str]] = None      # 원하는 OTT 목록
    include_book_service: bool = False
    max_monthly_budget: Optional[float] = None
    prefer_kpass: bool = False
    high_utility_usage: bool = False             # 공과금 지출 많은지

class TelecomSwapResult(BaseModel):
    plan_id: int
    carrier: str
    name: str
    monthly_cost: float
    current_cost: float
    monthly_savings: float
    annual_savings: float
    savings_equivalent: str        # "스타벅스 OO잔" 같은 감성 비유
    includes_ott: Optional[str]
    includes_book: bool
    detail_url: Optional[str]

class CardSwapResult(BaseModel):
    card_id: int
    issuer: str
    name: str
    benefit_summary: str
    estimated_monthly_benefit: float
    annual_benefit: float
    annual_fee: float
    net_annual_benefit: float
    apply_url: Optional[str]
    is_kpass: bool

class SwapResponse(BaseModel):
    telecom_options: List[TelecomSwapResult]
    card_options: List[CardSwapResult]
    best_combination_savings: float     # 최적 조합 시 총 절약액
    best_combination_description: str


# ── Notification ──────────────────────────────────────
class NotificationItem(BaseModel):
    type: str                   # "renewal_warning" | "swap_available" | "renewal_confirm"
    title: str
    body: str
    subscription_id: Optional[int] = None
    potential_savings: Optional[float] = None
    action: Optional[str] = None  # "swap" | "extend" | "cancel"
