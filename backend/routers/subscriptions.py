### routers/subscriptions.py ###
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Subscription
from schemas import SubscriptionCreate, SubscriptionOut
from typing import List
from datetime import date

router = APIRouter(prefix="/users/{user_id}/subscriptions", tags=["구독 관리"])


@router.get("/", response_model=List[SubscriptionOut])
def get_subscriptions(user_id: int, db: Session = Depends(get_db)):
    subs = db.query(Subscription).filter(
        Subscription.user_id == user_id,
        Subscription.is_active == True
    ).all()

    result = []
    today = date.today()
    for sub in subs:
        sub_out = SubscriptionOut.from_orm(sub)
        sub_out.days_until_renewal = (sub.renewal_date - today).days
        result.append(sub_out)
    return result


@router.post("/", response_model=SubscriptionOut)
def create_subscription(
    user_id: int,
    body: SubscriptionCreate,
    db: Session = Depends(get_db)
):
    sub = Subscription(user_id=user_id, **body.dict())
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


@router.delete("/{sub_id}")
def cancel_subscription(user_id: int, sub_id: int, db: Session = Depends(get_db)):
    sub = db.query(Subscription).filter(
        Subscription.id == sub_id,
        Subscription.user_id == user_id
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="구독을 찾을 수 없어요")
    sub.is_active = False
    db.commit()
    return {"message": f"{sub.name} 구독이 해지됐어요"}
