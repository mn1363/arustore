from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin, get_optional_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.common import (
    AnalyticsEventCreate,
    AnalyticsOverviewResponse,
    MessageResponse,
)
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.post(
    "/events", response_model=MessageResponse, status_code=status.HTTP_201_CREATED
)
async def track_event(
    payload: AnalyticsEventCreate,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await AnalyticsService(db).record_event(
        payload, user_id=current_user.id if current_user else None
    )
    return MessageResponse(message="Event recorded")


@router.get("/overview", response_model=AnalyticsOverviewResponse)
async def get_analytics_overview(
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> AnalyticsOverviewResponse:
    return await AnalyticsService(db).get_overview()
