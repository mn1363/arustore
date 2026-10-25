from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import Address, User
from app.schemas.common import MessageResponse
from app.schemas.user import (
    AddressCreate,
    AddressResponse,
    UserResponse,
    UserUpdate,
)

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def read_current_user(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    updates = payload.model_dump(exclude_unset=True)
    if "phone" in updates and updates["phone"]:
        conflict = (
            await db.execute(
                select(User.id).where(
                    User.phone == updates["phone"], User.id != current_user.id
                )
            )
        ).scalar_one_or_none()
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Phone number is already used by another account",
            )
    for field, value in updates.items():
        setattr(current_user, field, value)
    await db.commit()
    reloaded = (
        await db.execute(
            select(User)
            .options(selectinload(User.addresses))
            .where(User.id == current_user.id)
        )
    ).scalar_one()
    return UserResponse.model_validate(reloaded)


@router.get("/me/addresses", response_model=List[AddressResponse])
async def list_my_addresses(
    current_user: User = Depends(get_current_user),
) -> List[AddressResponse]:
    return [AddressResponse.model_validate(a) for a in (current_user.addresses or [])]


@router.post(
    "/me/addresses",
    response_model=AddressResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_my_address(
    payload: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AddressResponse:
    if payload.is_default:
        await db.execute(
            update(Address)
            .where(Address.user_id == current_user.id)
            .values(is_default=False)
        )
    addr = Address(user_id=current_user.id, **payload.model_dump())
    db.add(addr)
    await db.commit()
    await db.refresh(addr)
    return AddressResponse.model_validate(addr)


@router.delete("/me/addresses/{address_id}", response_model=MessageResponse)
async def delete_my_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    addr = (
        await db.execute(
            select(Address).where(
                Address.id == address_id, Address.user_id == current_user.id
            )
        )
    ).scalar_one_or_none()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    await db.delete(addr)
    await db.commit()
    return MessageResponse(message="Address deleted")
