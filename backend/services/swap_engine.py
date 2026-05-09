"""
SWAP 추천 엔진
- 현재 지출 분석 → 최적 요금제/카드 조합 추천
- 기회비용 계산 및 감성 비유 생성
"""
from sqlalchemy.orm import Session
from models import TelecomPlan, CardProduct, Spending, Subscription, CategoryEnum
from schemas import SwapCondition, TelecomSwapResult, CardSwapResult, SwapResponse
from typing import List
from datetime import date


# 감성 비유 기준표 (연간 절약액 기준)
SAVINGS_EQUIVALENTS = [
    (100_000, "스타벅스 아메리카노 약 {n}잔"),
    (20_000,  "편의점 삼각김밥 약 {n}개"),
    (15_000,  "치킨 약 {n}마리"),
    (13_000,  "영화 관람 약 {n}회"),
    (5_000,   "대중교통 약 {n}회"),
]

def savings_to_equivalent(annual_savings: float) -> str:
    for unit_price, template in SAVINGS_EQUIVALENTS:
        if annual_savings >= unit_price:
            n = int(annual_savings // unit_price)
            return template.format(n=n)
    return f"연 {int(annual_savings):,}원 절약"


def get_current_telecom_cost(db: Session, user_id: int) -> float:
    """현재 통신비 구독에서 월 비용 가져오기"""
    sub = db.query(Subscription).filter(
        Subscription.user_id == user_id,
        Subscription.category == CategoryEnum.TELECOM,
        Subscription.is_active == True
    ).first()
    return sub.monthly_cost if sub else 0.0


def get_spending_by_category(db: Session, user_id: int, year: int, month: int) -> dict:
    """카테고리별 지출 합계"""
    spendings = db.query(Spending).filter(
        Spending.user_id == user_id,
        Spending.year == year,
        Spending.month == month
    ).all()

    result = {}
    for s in spendings:
        result[s.category] = result.get(s.category, 0) + s.amount
    return result


def analyze_telecom_swaps(
    db: Session,
    user_id: int,
    condition: SwapCondition
) -> List[TelecomSwapResult]:
    """현재 요금제 대비 절약 가능한 요금제 추천"""

    current_cost = get_current_telecom_cost(db, user_id)
    if current_cost == 0:
        return []

    query = db.query(TelecomPlan)

    # 예산 조건
    if condition.max_monthly_budget:
        query = query.filter(TelecomPlan.monthly_cost <= condition.max_monthly_budget)

    # 현재 요금제보다 저렴한 것만
    query = query.filter(TelecomPlan.monthly_cost < current_cost)

    plans = query.all()
    results = []

    for plan in plans:
        # OTT 조건 필터
        if condition.include_ott:
            plan_otts = plan.includes_ott.split(",") if plan.includes_ott else []
            if not any(ott in plan_otts for ott in condition.include_ott):
                continue

        # 밀리의 서재 조건 필터
        if condition.include_book_service and not plan.includes_book:
            continue

        monthly_savings = current_cost - plan.monthly_cost
        annual_savings = monthly_savings * 12

        results.append(TelecomSwapResult(
            plan_id=plan.id,
            carrier=plan.carrier,
            name=plan.name,
            monthly_cost=plan.monthly_cost,
            current_cost=current_cost,
            monthly_savings=monthly_savings,
            annual_savings=annual_savings,
            savings_equivalent=savings_to_equivalent(annual_savings),
            includes_ott=plan.includes_ott,
            includes_book=plan.includes_book,
            detail_url=plan.detail_url,
        ))

    # 절약액 큰 순 정렬
    results.sort(key=lambda x: x.monthly_savings, reverse=True)
    return results[:5]


def analyze_card_swaps(
    db: Session,
    user_id: int,
    condition: SwapCondition,
    year: int,
    month: int
) -> List[CardSwapResult]:
    """지출 패턴 기반 최적 카드 추천"""

    spending = get_spending_by_category(db, user_id, year, month)

    utility_spend = spending.get(CategoryEnum.UTILITY, 0)
    transport_spend = spending.get(CategoryEnum.TRANSPORT, 0)
    convenience_spend = spending.get(CategoryEnum.OTHER, 0)  # 편의점 등 기타

    query = db.query(CardProduct)

    if condition.prefer_kpass:
        query = query.filter(CardProduct.is_kpass == True)

    cards = query.all()
    results = []

    for card in cards:
        # 지출 패턴 기반 예상 월 혜택 계산
        monthly_benefit = (
            utility_spend * (card.utility_discount / 100) +
            transport_spend * (card.transport_discount / 100) +
            convenience_spend * (card.convenience_discount / 100)
        )
        annual_benefit = monthly_benefit * 12
        net_annual = annual_benefit - card.annual_fee

        if net_annual <= 0:
            continue  # 연회비보다 혜택이 적으면 제외

        results.append(CardSwapResult(
            card_id=card.id,
            issuer=card.issuer,
            name=card.name,
            benefit_summary=card.benefit_summary,
            estimated_monthly_benefit=round(monthly_benefit, 0),
            annual_benefit=round(annual_benefit, 0),
            annual_fee=card.annual_fee,
            net_annual_benefit=round(net_annual, 0),
            apply_url=card.apply_url,
            is_kpass=card.is_kpass,
        ))

    results.sort(key=lambda x: x.net_annual_benefit, reverse=True)
    return results[:5]


def run_swap_analysis(
    db: Session,
    user_id: int,
    condition: SwapCondition,
    year: int,
    month: int
) -> SwapResponse:
    """통합 SWAP 분석 실행"""

    telecom_options = analyze_telecom_swaps(db, user_id, condition)
    card_options = analyze_card_swaps(db, user_id, condition, year, month)

    # 최적 조합 계산
    best_telecom_savings = telecom_options[0].annual_savings if telecom_options else 0
    best_card_savings = card_options[0].net_annual_benefit if card_options else 0
    total_savings = best_telecom_savings + best_card_savings

    if telecom_options and card_options:
        desc = (
            f"{telecom_options[0].carrier} {telecom_options[0].name} + "
            f"{card_options[0].issuer} {card_options[0].name} 조합으로 "
            f"연 {int(total_savings):,}원 절약 가능해요"
        )
    elif telecom_options:
        desc = f"{telecom_options[0].carrier} {telecom_options[0].name}으로 연 {int(total_savings):,}원 절약 가능해요"
    elif card_options:
        desc = f"{card_options[0].issuer} {card_options[0].name}으로 연 {int(total_savings):,}원 혜택 가능해요"
    else:
        desc = "현재 최적화된 상태예요. 잘 쓰고 계세요!"

    return SwapResponse(
        telecom_options=telecom_options,
        card_options=card_options,
        best_combination_savings=total_savings,
        best_combination_description=desc,
    )
