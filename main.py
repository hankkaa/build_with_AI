from fastapi import FastAPI
from database import engine, Base, SessionLocal
from models import User, TelecomPlan, CardProduct
from routers.subscriptions import router as sub_router
from routers.spending import router as spend_router
from routers.swap_and_notifications import router as swap_router, router as notif_router
from fastapi.middleware.cors import CORSMiddleware


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SWAP API",
    description="1인 가구를 위한 요금제·카드·구독 최적화 서비스",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sub_router)
app.include_router(spend_router)
app.include_router(swap_router)
app.include_router(notif_router)


@app.on_event("startup")
def seed_data():
    """앱 시작 시 기본 상품 데이터 시딩"""
    db = SessionLocal()

    if db.query(TelecomPlan).count() == 0:
        plans = [
            TelecomPlan(carrier="KT", name="KT 다이렉트 5G 슬림", monthly_cost=45000,
                        data_gb=-1, includes_ott="wavve", includes_book=False,
                        detail_url="https://kt.com"),
            TelecomPlan(carrier="KT", name="KT 5G 시니어 라이트", monthly_cost=35000,
                        data_gb=10, includes_ott=None, includes_book=False,
                        detail_url="https://kt.com"),
            TelecomPlan(carrier="SKT", name="SKT 0플랜 히어로", monthly_cost=55000,
                        data_gb=-1, includes_ott="wavve,floㅡ", includes_book=True,
                        detail_url="https://skt.com"),
            TelecomPlan(carrier="LGU+", name="LGU+ 5G 스탠다드", monthly_cost=50000,
                        data_gb=-1, includes_ott="seezn", includes_book=False,
                        detail_url="https://lguplus.com"),
            TelecomPlan(carrier="MVNO", name="알뜰폰 10GB+", monthly_cost=15000,
                        data_gb=10, includes_ott=None, includes_book=False,
                        detail_url="https://mvno.co.kr"),
        ]
        db.add_all(plans)

    if db.query(CardProduct).count() == 0:
        cards = [
            CardProduct(
                issuer="신한", name="Mr.Life",
                benefit_summary="공과금 10% 할인, 통신비 월 1만원 할인",
                utility_discount=10, transport_discount=0, convenience_discount=5,
                annual_fee=20000, apply_url="https://shinhancard.com",
            ),
            CardProduct(
                issuer="국민", name="KB국민 K-패스",
                benefit_summary="대중교통 최대 53% 환급 (K-패스)",
                utility_discount=0, transport_discount=53, convenience_discount=0,
                annual_fee=0, apply_url="https://kbcard.com", is_kpass=True,
            ),
            CardProduct(
                issuer="삼성", name="삼성 iD NEXT",
                benefit_summary="편의점 10% 할인, OTT 월 5천원 지원",
                utility_discount=0, transport_discount=10, convenience_discount=10,
                annual_fee=15000, apply_url="https://samsungcard.com",
            ),
            CardProduct(
                issuer="현대", name="현대 ZERO Edition2",
                benefit_summary="공과금 자동이체 5% 할인, 통신비 7% 할인",
                utility_discount=5, transport_discount=5, convenience_discount=3,
                annual_fee=10000, apply_url="https://hyundaicard.com",
            ),
        ]
        db.add_all(cards)

    db.commit()
    db.close()


@app.get("/")
def root():
    return {
        "service": "SWAP",
        "description": "1인 가구를 위한 고정 지출 최적화 서비스",
        "docs": "/docs",
    }
