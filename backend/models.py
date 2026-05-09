from sqlalchemy import Column, Integer, String, Float, Date, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from database import Base
import enum


class CategoryEnum(str, enum.Enum):
    TELECOM = "telecom"       # 통신비
    OTT = "ott"               # OTT 구독
    BOOK = "book"             # 전자책 (밀리의 서재 등)
    CARD = "card"             # 카드
    UTILITY = "utility"       # 공과금
    TRANSPORT = "transport"   # 교통
    OTHER = "other"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    region = Column(String, nullable=True)          # 거주지 (향후 지역 혜택용)
    notify_days_before = Column(Integer, default=7) # 만기 N일 전 알림
    notify_min_savings = Column(Integer, default=5000)  # 최소 절약 금액 알림 기준

    subscriptions = relationship("Subscription", back_populates="user")
    spendings = relationship("Spending", back_populates="user")


class Subscription(Base):
    """현재 구독 중인 서비스 목록"""
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)                           # ex) 넷플릭스, KT 5G 요금제
    category = Column(Enum(CategoryEnum))
    monthly_cost = Column(Float)                    # 월 비용
    renewal_date = Column(Date)                     # 다음 만기일
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="subscriptions")


class Spending(Base):
    """월별 지출 기록 (마이데이터 연동 or 수동 입력)"""
    __tablename__ = "spendings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category = Column(Enum(CategoryEnum))
    amount = Column(Float)
    description = Column(String, nullable=True)
    year = Column(Integer)
    month = Column(Integer)

    user = relationship("User", back_populates="spendings")


class TelecomPlan(Base):
    """통신사 요금제 목록"""
    __tablename__ = "telecom_plans"

    id = Column(Integer, primary_key=True, index=True)
    carrier = Column(String)           # KT, SKT, LGU+, MVNO
    name = Column(String)              # 요금제명
    monthly_cost = Column(Float)
    data_gb = Column(Float)            # 데이터 (GB), -1 이면 무제한
    includes_ott = Column(String, nullable=True)    # 포함 OTT (콤마 구분: "netflix,wavve")
    includes_book = Column(Boolean, default=False)  # 밀리의 서재 포함 여부
    detail_url = Column(String, nullable=True)


class CardProduct(Base):
    """카드 상품 목록"""
    __tablename__ = "card_products"

    id = Column(Integer, primary_key=True, index=True)
    issuer = Column(String)            # 신한, KB, 삼성 등
    name = Column(String)             # 카드명
    benefit_summary = Column(String)  # 혜택 요약
    utility_discount = Column(Float, default=0)     # 공과금 할인율 (%)
    transport_discount = Column(Float, default=0)   # 교통 할인율 (%)
    convenience_discount = Column(Float, default=0) # 편의점 할인율 (%)
    annual_fee = Column(Float, default=0)
    apply_url = Column(String, nullable=True)
    is_kpass = Column(Boolean, default=False)       # K-패스 여부
