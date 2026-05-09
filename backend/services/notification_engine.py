"""
알림 트리거 엔진
- 만기 D-n일 알림
- 절약 가능 금액 기준 알림
- 만기 후 재분석 → 연장/해지 추천
"""
from sqlalchemy.orm import Session
from models import Subscription, User
from schemas import NotificationItem
from services.swap_engine import get_current_telecom_cost, get_spending_by_category
from typing import List
from datetime import date, timedelta


def check_renewal_notifications(db: Session, user_id: int) -> List[NotificationItem]:
    """만기 D-n일 알림 체크"""
    notifications = []
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return []

    today = date.today()
    threshold = today + timedelta(days=user.notify_days_before)

    upcoming = db.query(Subscription).filter(
        Subscription.user_id == user_id,
        Subscription.is_active == True,
        Subscription.renewal_date <= threshold,
        Subscription.renewal_date >= today,
    ).all()

    for sub in upcoming:
        days_left = (sub.renewal_date - today).days

        notifications.append(NotificationItem(
            type="renewal_warning",
            title=f"{sub.name} 만기 D-{days_left}",
            body=f"{sub.renewal_date.strftime('%m월 %d일')}에 {int(sub.monthly_cost):,}원이 갱신돼요. 지난달 사용 내역을 확인해볼까요?",
            subscription_id=sub.id,
            action="swap",
        ))

    return notifications


def check_swap_available_notifications(
    db: Session,
    user_id: int,
    year: int,
    month: int,
    swap_savings: float,
) -> List[NotificationItem]:
    """절약 가능 금액이 기준 이상일 때 알림"""
    notifications = []
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return []

    if swap_savings >= user.notify_min_savings:
        notifications.append(NotificationItem(
            type="swap_available",
            title=f"월 {int(swap_savings):,}원 절약할 수 있어요",
            body=f"요금제나 카드를 바꾸면 연 {int(swap_savings * 12):,}원을 아낄 수 있어요. 지금 확인해보세요.",
            potential_savings=swap_savings,
            action="swap",
        ))

    return notifications


def check_renewal_decision(
    db: Session,
    user_id: int,
    subscription_id: int,
    year: int,
    month: int,
) -> NotificationItem:
    """
    만기 도래 시 당월 지출 분석 후 → 연장 or 해지 추천
    """
    sub = db.query(Subscription).filter(
        Subscription.id == subscription_id,
        Subscription.user_id == user_id,
    ).first()

    if not sub:
        return None

    spending = get_spending_by_category(db, user_id, year, month)

    # 해당 카테고리 지출에서 이 구독이 차지하는 비중 확인
    category_total = spending.get(sub.category, 0)

    # 해당 구독 외 같은 카테고리 지출이 거의 없으면 → 잘 사용 중
    other_spend_in_category = max(0, category_total - sub.monthly_cost)

    if other_spend_in_category < sub.monthly_cost * 0.2:
        # 이 구독이 카테고리 지출의 80% 이상 → 주력으로 잘 쓰는 중
        return NotificationItem(
            type="renewal_confirm",
            title=f"{sub.name} 갱신할까요?",
            body=f"이번 달 잘 사용하셨어요. {int(sub.monthly_cost):,}원에 연장하시겠어요?",
            subscription_id=subscription_id,
            action="extend",
        )
    else:
        # 같은 카테고리에 다른 지출이 많음 → 중복 가능성
        return NotificationItem(
            type="renewal_confirm",
            title=f"{sub.name}, 계속 필요하신가요?",
            body=(
                f"이번 달 비슷한 서비스에 {int(other_spend_in_category):,}원을 더 쓰셨어요. "
                f"{sub.name}을 해지하면 월 {int(sub.monthly_cost):,}원을 아낄 수 있어요."
            ),
            subscription_id=subscription_id,
            potential_savings=sub.monthly_cost,
            action="cancel",
        )


def get_all_notifications(
    db: Session,
    user_id: int,
    year: int,
    month: int,
    current_swap_savings: float = 0,
) -> List[NotificationItem]:
    """전체 알림 목록 조회"""
    notifications = []
    notifications += check_renewal_notifications(db, user_id)
    notifications += check_swap_available_notifications(db, user_id, year, month, current_swap_savings)
    return notifications
