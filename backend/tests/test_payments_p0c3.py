import asyncio
from datetime import datetime, timedelta, timezone
from typing import AsyncGenerator, Callable, List, Optional
from unittest.mock import patch

from httpx import AsyncClient
import pytest
import pytest_asyncio
from pydantic import ValidationError
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import app.models  # noqa: F401
from app.api.v1.endpoints.payments import (
    get_payment_adapter,
    get_payment_now_fn,
)
from app.core.config import Settings
from app.core.database import Base, get_db
from app.main import create_application
from app.models.discount import Discount, DiscountUsage
from app.models.order import Order, OrderStatusHistory
from app.models.payment import (
    DiscountReservation,
    InventoryReservation,
    PaymentAttempt,
)
from app.models.product import Product
from app.models.user import User
from app.services.payment_gateway import (
    GatewaySessionInitResult,
    GatewaySessionRequest,
    GatewayVerificationRequest,
    GatewayVerificationResult,
    SandboxPaymentAdapter,
)
from app.services.payment_lifecycle_service import PaymentLifecycleService
from app.services.seed_service import seed_initial_catalog

STRONG_PROD_SECRET = "prod-secret-9f8e7d6c5b4a392817263544556677889900aabbccddeeff"

VALID_SHIPPING = {
    "customer_name": "سهراب سپهری",
    "customer_phone": "09123334455",
    "shipping_address": "تهران، خیابان ولیعصر، کوچه باغ فردوس، پلاک ۱۲",
    "postal_code": "1961734567",
    "notes": "تحویل با هماهنگی قبلی",
}


class SandboxTestEnv:
    def __init__(
        self,
        client: AsyncClient,
        session_factory: async_sessionmaker[AsyncSession],
        app_settings: Settings,
        clock: List[datetime],
        app_instance,
    ) -> None:
        self.client = client
        self.session_factory = session_factory
        self.settings = app_settings
        self._clock = clock
        self.app = app_instance

    @property
    def now(self) -> datetime:
        return self._clock[0]

    def advance(self, seconds: int) -> datetime:
        self._clock[0] = self._clock[0] + timedelta(seconds=seconds)
        return self._clock[0]


@pytest_asyncio.fixture
async def sandbox_env(tmp_path) -> AsyncGenerator[SandboxTestEnv, None]:
    db_file = tmp_path / "test_p0c3_sandbox.db"
    test_engine = create_async_engine(
        f"sqlite+aiosqlite:///{db_file}",
        connect_args={"check_same_thread": False},
    )
    TestSessionLocal = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as seed_session:
        await seed_initial_catalog(seed_session)

    sandbox_settings = Settings(
        ENVIRONMENT="development",
        PAYMENT_PROVIDER="sandbox",
        PAYMENT_SANDBOX_ENABLED=True,
        PAYMENT_RESERVATION_TTL_SECONDS=900,
        AUTO_SEED_DEMO_DATA=False,
    )
    test_app = create_application(sandbox_settings)

    clock = [datetime(2026, 10, 25, 10, 0, 0, tzinfo=timezone.utc)]

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with TestSessionLocal() as session:
            yield session

    def override_now_fn() -> Callable[[], datetime]:
        return lambda: clock[0]

    test_app.dependency_overrides[get_db] = override_get_db
    test_app.dependency_overrides[get_payment_now_fn] = override_now_fn

    async with AsyncClient(app=test_app, base_url="http://testserver") as ac:
        yield SandboxTestEnv(
            client=ac,
            session_factory=TestSessionLocal,
            app_settings=sandbox_settings,
            clock=clock,
            app_instance=test_app,
        )

    test_app.dependency_overrides.clear()
    await test_engine.dispose()


async def register_customer(
    ac: AsyncClient, email: str, phone: str
) -> tuple[dict[str, str], int]:
    res = await ac.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": f"کاربر {email.split('@')[0]}",
            "phone": phone,
            "password": "StrongPassword123!",
        },
    )
    assert res.status_code == 201, res.text
    body = res.json()
    return {"Authorization": f"Bearer {body['access_token']}"}, int(body["user"]["id"])


async def login_admin(ac: AsyncClient) -> dict[str, str]:
    res = await ac.post(
        "/api/v1/auth/login/json",
        json={"email_or_username": "admin@arustore.ir", "password": "Admin1234!"},
    )
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


async def create_pending_order(
    ac: AsyncClient,
    headers: dict[str, str],
    *,
    product_id: int = 1,
    quantity: int = 1,
    idempotency_key: str,
    promo_code: Optional[str] = None,
) -> dict:
    add_res = await ac.post(
        "/api/v1/cart/items",
        headers=headers,
        json={"product_id": product_id, "quantity": quantity},
    )
    assert add_res.status_code == 201, add_res.text

    payload = dict(VALID_SHIPPING)
    if promo_code is not None:
        payload["promo_code"] = promo_code

    ord_res = await ac.post(
        "/api/v1/orders/",
        headers={**headers, "Idempotency-Key": idempotency_key},
        json=payload,
    )
    assert ord_res.status_code == 201, ord_res.text
    order = ord_res.json()
    assert order["status"] == "pending_payment"
    assert order["payment_status"] == "pending"
    return order


@pytest.mark.asyncio
async def test_01_disabled_provider_or_unenabled_sandbox_returns_503_without_side_effects(
    tmp_path,
) -> None:
    db_file = tmp_path / "disabled_pay.db"
    eng = create_async_engine(f"sqlite+aiosqlite:///{db_file}")
    SM = async_sessionmaker(eng, class_=AsyncSession, expire_on_commit=False)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with SM() as s:
        await seed_initial_catalog(s)

    # Case A: Default Settings (PAYMENT_PROVIDER="disabled", PAYMENT_GATEWAY_KEY="sandbox_key")
    default_settings = Settings(AUTO_SEED_DEMO_DATA=False)
    assert default_settings.PAYMENT_PROVIDER == "disabled"
    assert default_settings.PAYMENT_SANDBOX_ENABLED is False
    assert default_settings.is_payment_enabled is False

    # Case B: PAYMENT_PROVIDER="sandbox" WITHOUT PAYMENT_SANDBOX_ENABLED=True -> still disabled!
    half_sandbox_settings = Settings(
        PAYMENT_PROVIDER="sandbox",
        PAYMENT_SANDBOX_ENABLED=False,
        AUTO_SEED_DEMO_DATA=False,
    )
    assert half_sandbox_settings.is_payment_enabled is False

    for idx, cfg in enumerate((default_settings, half_sandbox_settings)):
        test_app = create_application(cfg)

        async def override_db() -> AsyncGenerator[AsyncSession, None]:
            async with SM() as session:
                yield session

        test_app.dependency_overrides[get_db] = override_db
        async with AsyncClient(app=test_app, base_url="http://testserver") as ac:
            headers, _ = await register_customer(
                ac, f"disabled-{idx}@arustore.ir", f"0912800001{idx}"
            )
            order = await create_pending_order(
                ac, headers, product_id=1, quantity=1, idempotency_key=f"ord-dis-{idx}"
            )
            pay_res = await ac.post(
                f"/api/v1/orders/{order['id']}/payment-attempts",
                headers={**headers, "Idempotency-Key": f"pay-dis-{idx}"},
                json={},
            )
            assert pay_res.status_code == 503
            assert pay_res.json()["code"] == "payment_provider_unavailable"

            # Sandbox resolve route must NOT be registered when sandbox is not active
            sbx_res = await ac.post(
                f"/api/v1/orders/{order['id']}/payment-attempts/1/sandbox-resolve",
                headers=headers,
                json={"outcome": "succeeded", "sandbox_token": "x" * 32},
            )
            assert sbx_res.status_code == 404

    async with SM() as s:
        assert (await s.execute(select(func.count(PaymentAttempt.id)))).scalar_one() == 0
        assert (
            await s.execute(select(func.count(InventoryReservation.id)))
        ).scalar_one() == 0
        assert (
            await s.execute(select(func.count(DiscountReservation.id)))
        ).scalar_one() == 0

    await eng.dispose()


@pytest.mark.asyncio
async def test_02_production_boundary_blocks_sandbox_and_omits_sandbox_route(
    tmp_path,
) -> None:
    # 1. Production with PAYMENT_PROVIDER="sandbox" fails startup validation
    with pytest.raises(ValidationError):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY=STRONG_PROD_SECRET,
            AUTO_SEED_DEMO_DATA=False,
            ALLOWED_HOSTS=["arustore.ir"],
            CORS_ORIGINS=["https://arustore.ir"],
            PAYMENT_PROVIDER="sandbox",
            PAYMENT_SANDBOX_ENABLED=False,
        )

    # 2. Production with PAYMENT_SANDBOX_ENABLED=True fails startup validation
    with pytest.raises(ValidationError):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY=STRONG_PROD_SECRET,
            AUTO_SEED_DEMO_DATA=False,
            ALLOWED_HOSTS=["arustore.ir"],
            CORS_ORIGINS=["https://arustore.ir"],
            PAYMENT_PROVIDER="disabled",
            PAYMENT_SANDBOX_ENABLED=True,
        )

    # 3. Production with disabled provider starts cleanly, omits sandbox route, and fails closed with 503
    prod_settings = Settings(
        ENVIRONMENT="production",
        SECRET_KEY=STRONG_PROD_SECRET,
        AUTO_SEED_DEMO_DATA=False,
        ALLOWED_HOSTS=["arustore.ir", "testserver"],
        CORS_ORIGINS=["https://arustore.ir"],
    )
    prod_app = create_application(prod_settings)
    registered_paths = {getattr(r, "path", "") for r in prod_app.routes}
    assert not any("sandbox-resolve" in p for p in registered_paths)

    db_file = tmp_path / "prod_boundary.db"
    eng = create_async_engine(f"sqlite+aiosqlite:///{db_file}")
    SM = async_sessionmaker(eng, class_=AsyncSession, expire_on_commit=False)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with SM() as s:
        await seed_initial_catalog(s)

    async def override_db() -> AsyncGenerator[AsyncSession, None]:
        async with SM() as session:
            yield session

    prod_app.dependency_overrides[get_db] = override_db
    async with AsyncClient(app=prod_app, base_url="http://testserver") as ac:
        headers, _ = await register_customer(ac, "prod-user@arustore.ir", "09128000021")
        order = await create_pending_order(
            ac, headers, product_id=1, quantity=1, idempotency_key="prod-ord-1"
        )
        res_503 = await ac.post(
            f"/api/v1/orders/{order['id']}/payment-attempts",
            headers={**headers, "Idempotency-Key": "prod-pay-1"},
            json={},
        )
        assert res_503.status_code == 503
        assert res_503.json()["code"] == "payment_provider_unavailable"

    async with SM() as s:
        assert (await s.execute(select(func.count(PaymentAttempt.id)))).scalar_one() == 0

    await eng.dispose()


@pytest.mark.asyncio
async def test_03_idempotent_initiation_replays_attempt_and_reproducible_hmac_token(
    sandbox_env: SandboxTestEnv,
) -> None:
    ac = sandbox_env.client
    headers, _ = await register_customer(ac, "idem-pay@arustore.ir", "09128000031")
    order = await create_pending_order(
        ac, headers, product_id=1, quantity=2, idempotency_key="ord-idem-1"
    )

    first = await ac.post(
        f"/api/v1/orders/{order['id']}/payment-attempts",
        headers={**headers, "Idempotency-Key": "pay-idem-key-1"},
        json={},
    )
    assert first.status_code == 201, first.text
    b1 = first.json()
    assert b1["status"] == "pending"
    assert b1["provider"] == "sandbox"
    assert b1["currency_unit"] == "toman"
    assert b1["amount_toman"] == order["total_toman"]
    assert b1["reservation_status"] == "active"
    token_1 = b1["next_action"]["sandbox_token"]
    assert isinstance(token_1, str) and len(token_1) == 64

    # Replay with exact same Idempotency-Key -> 200 OK, exact same attempt & reproducible token
    replay = await ac.post(
        f"/api/v1/orders/{order['id']}/payment-attempts",
        headers={**headers, "Idempotency-Key": "pay-idem-key-1"},
    )
    assert replay.status_code == 200, replay.text
    b2 = replay.json()
    assert b2["id"] == b1["id"]
    assert b2["attempt_number"] == b1["attempt_number"]
    assert b2["next_action"]["sandbox_token"] == token_1

    # Verify raw token is NOT persisted in DB and only ONE reservation row exists
    async with sandbox_env.session_factory() as s:
        attempts = (await s.execute(select(PaymentAttempt))).scalars().all()
        assert len(attempts) == 1
        assert attempts[0].sandbox_nonce is not None
        assert attempts[0].sandbox_nonce != token_1
        inv_rows = (await s.execute(select(InventoryReservation))).scalars().all()
        assert len(inv_rows) == 1
        assert inv_rows[0].quantity == 2

    # Read endpoints (`latest` before `{attempt_id}`) do NOT expose raw sandbox_token or settle order
    latest_res = await ac.get(
        f"/api/v1/orders/{order['id']}/payment-attempts/latest", headers=headers
    )
    assert latest_res.status_code == 200
    assert latest_res.json()["id"] == b1["id"]
    assert latest_res.json()["next_action"]["sandbox_token"] is None
    assert latest_res.json()["order_payment_status"] == "pending"

    detail_res = await ac.get(
        f"/api/v1/orders/{order['id']}/payment-attempts/{b1['id']}", headers=headers
    )
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == b1["id"]

    # Replayed token resolves attempt cleanly
    resolve_res = await ac.post(
        f"/api/v1/orders/{order['id']}/payment-attempts/{b1['id']}/sandbox-resolve",
        headers=headers,
        json={"outcome": "succeeded", "sandbox_token": b2["next_action"]["sandbox_token"]},
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == "succeeded"


@pytest.mark.asyncio
async def test_04_key_reuse_on_other_order_and_active_attempt_conflict(
    sandbox_env: SandboxTestEnv,
) -> None:
    ac = sandbox_env.client
    headers, _ = await register_customer(ac, "conflict-keys@arustore.ir", "09128000041")
    order_a = await create_pending_order(
        ac, headers, product_id=1, quantity=1, idempotency_key="ord-conf-a"
    )
    order_b = await create_pending_order(
        ac, headers, product_id=2, quantity=1, idempotency_key="ord-conf-b"
    )

    # Missing / blank Idempotency-Key -> 400
    assert (
        await ac.post(f"/api/v1/orders/{order_a['id']}/payment-attempts", headers=headers)
    ).status_code == 400
    assert (
        await ac.post(
            f"/api/v1/orders/{order_a['id']}/payment-attempts",
            headers={**headers, "Idempotency-Key": "   "},
        )
    ).status_code == 400

    res_a = await ac.post(
        f"/api/v1/orders/{order_a['id']}/payment-attempts",
        headers={**headers, "Idempotency-Key": "shared-ik"},
    )
    assert res_a.status_code == 201

    # Same key on Order B -> 409 idempotency_key_order_mismatch
    mismatch_res = await ac.post(
        f"/api/v1/orders/{order_b['id']}/payment-attempts",
        headers={**headers, "Idempotency-Key": "shared-ik"},
    )
    assert mismatch_res.status_code == 409
    assert mismatch_res.json()["code"] == "idempotency_key_order_mismatch"

    # Different key on Order A while first attempt is still active -> 409 active_payment_attempt_exists
    dup_active = await ac.post(
        f"/api/v1/orders/{order_a['id']}/payment-attempts",
        headers={**headers, "Idempotency-Key": "second-ik-while-active"},
    )
    assert dup_active.status_code == 409
    assert dup_active.json()["code"] == "active_payment_attempt_exists"


@pytest.mark.asyncio
async def test_05_ownership_rbac_and_order_attempt_binding(
    sandbox_env: SandboxTestEnv,
) -> None:
    ac = sandbox_env.client
    owner_h, _ = await register_customer(ac, "owner@arustore.ir", "09128000051")
    other_h, _ = await register_customer(ac, "intruder@arustore.ir", "09128000052")
    admin_h = await login_admin(ac)

    order_1 = await create_pending_order(
        ac, owner_h, product_id=1, quantity=1, idempotency_key="ord-own-1"
    )
    order_2 = await create_pending_order(
        ac, owner_h, product_id=2, quantity=1, idempotency_key="ord-own-2"
    )

    # Non-existent order -> 404
    assert (
        await ac.post(
            "/api/v1/orders/999999/payment-attempts",
            headers={**owner_h, "Idempotency-Key": "missing-ord"},
        )
    ).status_code == 404

    # Other customer cannot initiate -> 403
    assert (
        await ac.post(
            f"/api/v1/orders/{order_1['id']}/payment-attempts",
            headers={**other_h, "Idempotency-Key": "intruder-ik"},
        )
    ).status_code == 403

    # Even admin cannot initiate a customer payment attempt on someone else's order -> 403
    assert (
        await ac.post(
            f"/api/v1/orders/{order_1['id']}/payment-attempts",
            headers={**admin_h, "Idempotency-Key": "admin-ik"},
        )
    ).status_code == 403

    init_res = await ac.post(
        f"/api/v1/orders/{order_1['id']}/payment-attempts",
        headers={**owner_h, "Idempotency-Key": "owner-ik-1"},
    )
    assert init_res.status_code == 201
    att_id = init_res.json()["id"]
    tok = init_res.json()["next_action"]["sandbox_token"]

    # Intruder gets 403 on GET, cancel, and sandbox-resolve
    assert (
        await ac.get(
            f"/api/v1/orders/{order_1['id']}/payment-attempts/{att_id}", headers=other_h
        )
    ).status_code == 403
    assert (
        await ac.post(
            f"/api/v1/orders/{order_1['id']}/payment-attempts/{att_id}/cancel",
            headers=other_h,
        )
    ).status_code == 403
    assert (
        await ac.post(
            f"/api/v1/orders/{order_1['id']}/payment-attempts/{att_id}/sandbox-resolve",
            headers=other_h,
            json={"outcome": "succeeded", "sandbox_token": tok},
        )
    ).status_code == 403

    # Mismatched order_2 with attempt_1 -> 404
    assert (
        await ac.get(
            f"/api/v1/orders/{order_2['id']}/payment-attempts/{att_id}", headers=owner_h
        )
    ).status_code == 404
    assert (
        await ac.post(
            f"/api/v1/orders/{order_2['id']}/payment-attempts/{att_id}/sandbox-resolve",
            headers=owner_h,
            json={"outcome": "succeeded", "sandbox_token": tok},
        )
    ).status_code == 404

    # Admin CAN query and cancel attempt
    assert (
        await ac.get(
            f"/api/v1/orders/{order_1['id']}/payment-attempts/latest", headers=admin_h
        )
    ).status_code == 200
    assert (
        await ac.post(
            f"/api/v1/orders/{order_1['id']}/payment-attempts/{att_id}/cancel",
            headers=admin_h,
            json={"reason": "Admin support cancellation"},
        )
    ).status_code == 200


@pytest.mark.asyncio
async def test_06_forbids_client_amount_status_provider_and_bad_sandbox_token(
    sandbox_env: SandboxTestEnv,
) -> None:
    ac = sandbox_env.client
    headers, _ = await register_customer(ac, "tamper@arustore.ir", "09128000061")
    order = await create_pending_order(
        ac, headers, product_id=1, quantity=1, idempotency_key="ord-tamper-1"
    )

    for idx, forbidden_body in enumerate(
        [
            {"amount": 100},
            {"amount_toman": 100},
            {"total": 1.0},
            {"status": "succeeded"},
            {"payment_status": "paid"},
            {"provider": "sandbox"},
            {"payment_reference": "FAKE-REF"},
        ]
    ):
        r = await ac.post(
            f"/api/v1/orders/{order['id']}/payment-attempts",
            headers={**headers, "Idempotency-Key": f"tamper-ik-{idx}"},
            json=forbidden_body,
        )
        assert r.status_code == 422

    init_res = await ac.post(
        f"/api/v1/orders/{order['id']}/payment-attempts",
        headers={**headers, "Idempotency-Key": "clean-ik"},
        json={},
    )
    assert init_res.status_code == 201
    att_id = init_res.json()["id"]
    valid_tok = init_res.json()["next_action"]["sandbox_token"]

    # Extra fields or failure_code on succeeded rejected with 422
    for bad_resolve in (
        {"outcome": "succeeded", "sandbox_token": valid_tok, "amount_toman": 1},
        {"outcome": "succeeded", "sandbox_token": valid_tok, "provider_transaction_id": "X"},
        {"outcome": "succeeded", "sandbox_token": valid_tok, "failure_code": "err"},
    ):
        assert (
            await ac.post(
                f"/api/v1/orders/{order['id']}/payment-attempts/{att_id}/sandbox-resolve",
                headers=headers,
                json=bad_resolve,
            )
        ).status_code == 422

    # Forged sandbox_token -> 403 with zero order/history/attempt mutation
    bad_tok_res = await ac.post(
        f"/api/v1/orders/{order['id']}/payment-attempts/{att_id}/sandbox-resolve",
        headers=headers,
        json={"outcome": "succeeded", "sandbox_token": "0" * 64},
    )
    assert bad_tok_res.status_code == 403
    assert bad_tok_res.json()["code"] == "invalid_sandbox_token"

    ord_check = (await ac.get(f"/api/v1/orders/{order['id']}", headers=headers)).json()
    assert ord_check["status"] == "pending_payment"
    assert ord_check["payment_status"] == "pending"
    assert len(ord_check["status_history"]) == 1


@pytest.mark.asyncio
async def test_07_concurrent_last_unit_stock_reservation_allows_single_winner(
    sandbox_env: SandboxTestEnv,
) -> None:
    ac = sandbox_env.client
    # Set Product 4 physical stock to 1
    async with sandbox_env.session_factory() as s:
        p4 = (await s.execute(select(Product).where(Product.id == 4))).scalar_one()
        p4.stock_quantity = 1
        p4.in_stock = True
        await s.commit()
        await s.refresh(p4)
        p4_updated_before = p4.updated_at

    h1, _ = await register_customer(ac, "race-stock-1@arustore.ir", "09128000071")
    h2, _ = await register_customer(ac, "race-stock-2@arustore.ir", "09128000072")

    ord_1 = await create_pending_order(
        ac, h1, product_id=4, quantity=1, idempotency_key="race-ord-1"
    )
    ord_2 = await create_pending_order(
        ac, h2, product_id=4, quantity=1, idempotency_key="race-ord-2"
    )

    r1, r2 = await asyncio.gather(
        ac.post(
            f"/api/v1/orders/{ord_1['id']}/payment-attempts",
            headers={**h1, "Idempotency-Key": "race-pay-1"},
        ),
        ac.post(
            f"/api/v1/orders/{ord_2['id']}/payment-attempts",
            headers={**h2, "Idempotency-Key": "race-pay-2"},
        ),
    )
    statuses = sorted([r1.status_code, r2.status_code])
    assert statuses == [201, 409], (r1.text, r2.text)

    loser = r1 if r1.status_code == 409 else r2
    assert loser.json()["code"] == "insufficient_available_stock"

    async with sandbox_env.session_factory() as s:
        svc = PaymentLifecycleService(s, app_settings=sandbox_env.settings, now_fn=lambda: sandbox_env.now)
        assert await svc.compute_sellable_stock(4) == 0

        p4_after = (await s.execute(select(Product).where(Product.id == 4))).scalar_one()
        # Physical stock is NOT decremented until settlement, and updated_at was NOT artificially touched
        assert p4_after.stock_quantity == 1
        assert p4_after.updated_at == p4_updated_before

        active_res = (
            await s.execute(
                select(InventoryReservation).where(
                    InventoryReservation.product_id == 4,
                    InventoryReservation.status == "active",
                )
            )
        ).scalars().all()
        assert len(active_res) == 1
        assert active_res[0].quantity == 1


@pytest.mark.asyncio
async def test_08_multi_product_all_or_nothing_rollback_and_same_product_aggregation(
    sandbox_env: SandboxTestEnv,
) -> None:
    ac = sandbox_env.client
    async with sandbox_env.session_factory() as s:
        p5 = (await s.execute(select(Product).where(Product.id == 5))).scalar_one()
        p5.stock_quantity = 1
        p5.in_stock = True
        await s.commit()

    h_holder, _ = await register_customer(ac, "holder@arustore.ir", "09128000081")
    h_multi, _ = await register_customer(ac, "multi@arustore.ir", "09128000082")

    # Multi-product order created BEFORE holder reserves Product 5's last unit
    assert (
        await ac.post(
            "/api/v1/cart/items",
            headers=h_multi,
            json={"product_id": 1, "quantity": 1, "selected_edition": "standard"},
        )
    ).status_code == 201
    assert (
        await ac.post(
            "/api/v1/cart/items",
            headers=h_multi,
            json={"product_id": 1, "quantity": 2, "selected_edition": "gift"},
        )
    ).status_code == 201
    assert (
        await ac.post(
            "/api/v1/cart/items",
            headers=h_multi,
            json={"product_id": 5, "quantity": 1},
        )
    ).status_code == 201
    multi_ord_res = await ac.post(
        "/api/v1/orders/",
        headers={**h_multi, "Idempotency-Key": "multi-ord-1"},
        json=VALID_SHIPPING,
    )
    assert multi_ord_res.status_code == 201
    multi_order = multi_ord_res.json()
    assert len(multi_order["items"]) == 3

    # Holder reserves Product 5's only unit
    holder_ord = await create_pending_order(
        ac, h_holder, product_id=5, quantity=1, idempotency_key="holder-ord-1"
    )
    holder_init = await ac.post(
        f"/api/v1/orders/{holder_ord['id']}/payment-attempts",
        headers={**h_holder, "Idempotency-Key": "holder-pay-1"},
    )
    assert holder_init.status_code == 201

    # Multi-product order fails on Product 5 -> MUST roll back Product 1 reservation too!
    fail_multi = await ac.post(
        f"/api/v1/orders/{multi_order['id']}/payment-attempts",
        headers={**h_multi, "Idempotency-Key": "multi-pay-fail"},
    )
    assert fail_multi.status_code == 409
    assert fail_multi.json()["code"] == "insufficient_available_stock"

    async with sandbox_env.session_factory() as s:
        p1_res = (
            await s.execute(
                select(InventoryReservation).where(
                    InventoryReservation.order_id == multi_order["id"]
                )
            )
        ).scalars().all()
        assert p1_res == []
        multi_atts = (
            await s.execute(
                select(PaymentAttempt).where(
                    PaymentAttempt.order_id == multi_order["id"]
                )
            )
        ).scalars().all()
        assert multi_atts == []

    # Release holder's attempt -> now multi_order succeeds and aggregates Product 1 lines (1 + 2 = 3)!
    await ac.post(
        f"/api/v1/orders/{holder_ord['id']}/payment-attempts/{holder_init.json()['id']}/cancel",
        headers=h_holder,
    )
    ok_multi = await ac.post(
        f"/api/v1/orders/{multi_order['id']}/payment-attempts",
        headers={**h_multi, "Idempotency-Key": "multi-pay-ok"},
    )
    assert ok_multi.status_code == 201
    inv_map = {
        r["product_id"]: r["quantity"] for r in ok_multi.json()["inventory_reservations"]
    }
    assert inv_map == {1: 3, 5: 1}


@pytest.mark.asyncio
async def test_09_concurrent_last_promo_capacity_reservation_release_and_single_consumption(
    sandbox_env: SandboxTestEnv,
) -> None:
    ac = sandbox_env.client
    async with sandbox_env.session_factory() as s:
        promo = Discount(
            code="SOLOCAP",
            description="Single capacity promo",
            discount_percent=10.0,
            min_order_amount=10.0,
            usage_limit=1,
            used_count=0,
            is_active=True,
        )
        s.add(promo)
        await s.commit()
        promo_id = promo.id

    ha, _ = await register_customer(ac, "promo-a@arustore.ir", "09128000091")
    hb, _ = await register_customer(ac, "promo-b@arustore.ir", "09128000092")

    ord_a = await create_pending_order(
        ac, ha, product_id=2, quantity=1, idempotency_key="ord-pa", promo_code="SOLOCAP"
    )
    ord_b = await create_pending_order(
        ac, hb, product_id=2, quantity=1, idempotency_key="ord-pb", promo_code="SOLOCAP"
    )

    ra, rb = await asyncio.gather(
        ac.post(
            f"/api/v1/orders/{ord_a['id']}/payment-attempts",
            headers={**ha, "Idempotency-Key": "pay-pa-1"},
        ),
        ac.post(
            f"/api/v1/orders/{ord_b['id']}/payment-attempts",
            headers={**hb, "Idempotency-Key": "pay-pb-1"},
        ),
    )
    assert sorted([ra.status_code, rb.status_code]) == [201, 409]
    winner_res, winner_h, winner_ord = (
        (ra, ha, ord_a) if ra.status_code == 201 else (rb, hb, ord_b)
    )
    loser_res, loser_h, loser_ord = (
        (rb, hb, ord_b) if ra.status_code == 201 else (ra, ha, ord_a)
    )
    assert loser_res.json()["code"] == "promo_capacity_exhausted"

    # Loser must have ZERO leftover inventory or discount reservations
    async with sandbox_env.session_factory() as s:
        loser_inv = (
            await s.execute(
                select(InventoryReservation).where(
                    InventoryReservation.order_id == loser_ord["id"]
                )
            )
        ).scalars().all()
        assert loser_inv == []

    # Winner fails payment -> releases promo reservation -> loser can now reserve and settle!
    w_att = winner_res.json()
    fail_res = await ac.post(
        f"/api/v1/orders/{winner_ord['id']}/payment-attempts/{w_att['id']}/sandbox-resolve",
        headers=winner_h,
        json={
            "outcome": "failed",
            "sandbox_token": w_att["next_action"]["sandbox_token"],
            "failure_code": "card_declined",
        },
    )
    assert fail_res.status_code == 200
    assert fail_res.json()["status"] == "failed"
    assert fail_res.json()["discount_reservation"]["status"] == "released"
    assert fail_res.json()["reservation_status"] == "released"

    winner_ord_after_fail = (
        await ac.get(f"/api/v1/orders/{winner_ord['id']}", headers=winner_h)
    ).json()
    assert winner_ord_after_fail["status"] == "pending_payment"
    assert winner_ord_after_fail["payment_status"] == "pending"
    assert len(winner_ord_after_fail["status_history"]) == 1

    loser_retry = await ac.post(
        f"/api/v1/orders/{loser_ord['id']}/payment-attempts",
        headers={**loser_h, "Idempotency-Key": "pay-loser-2"},
    )
    assert loser_retry.status_code == 201
    l_att = loser_retry.json()

    settle_res = await ac.post(
        f"/api/v1/orders/{loser_ord['id']}/payment-attempts/{l_att['id']}/sandbox-resolve",
        headers=loser_h,
        json={
            "outcome": "succeeded",
            "sandbox_token": l_att["next_action"]["sandbox_token"],
        },
    )
    assert settle_res.status_code == 200
    assert settle_res.json()["discount_reservation"]["status"] == "consumed"

    # Original winner tries again after promo capacity was permanently consumed -> 409
    exhausted_res = await ac.post(
        f"/api/v1/orders/{winner_ord['id']}/payment-attempts",
        headers={**winner_h, "Idempotency-Key": "pay-winner-after-exhaust"},
    )
    assert exhausted_res.status_code == 409
    assert exhausted_res.json()["code"] == "promo_capacity_exhausted"

    async with sandbox_env.session_factory() as s:
        d_after = (await s.execute(select(Discount).where(Discount.id == promo_id))).scalar_one()
        assert d_after.used_count == 1
        usages = (
            await s.execute(
                select(DiscountUsage).where(DiscountUsage.discount_id == promo_id)
            )
        ).scalars().all()
        assert len(usages) == 1
        assert usages[0].order_id == loser_ord["id"]


@pytest.mark.asyncio
async def test_10_timeout_failure_cancel_and_success_settlement_invariants(
    sandbox_env: SandboxTestEnv,
) -> None:
    ac = sandbox_env.client
    async with sandbox_env.session_factory() as s:
        p3 = (await s.execute(select(Product).where(Product.id == 3))).scalar_one()
        p3.stock_quantity = 2
        p3.in_stock = True
        await s.commit()

    headers, user_id = await register_customer(ac, "lifecycle@arustore.ir", "09128000101")
    order = await create_pending_order(
        ac, headers, product_id=3, quantity=2, idempotency_key="ord-life-1"
    )

    # 1. Initiate & simulate indeterminate_timeout -> 504, remains pending, reservation stays active
    init_1 = await ac.post(
        f"/api/v1/orders/{order['id']}/payment-attempts",
        headers={**headers, "Idempotency-Key": "life-ik-1"},
    )
    assert init_1.status_code == 201
    att_1 = init_1.json()
    tok_1 = att_1["next_action"]["sandbox_token"]

    timeout_res = await ac.post(
        f"/api/v1/orders/{order['id']}/payment-attempts/{att_1['id']}/sandbox-resolve",
        headers=headers,
        json={"outcome": "indeterminate_timeout", "sandbox_token": tok_1},
    )
    assert timeout_res.status_code == 504
    assert timeout_res.json()["code"] == "gateway_verification_timeout"

    async with sandbox_env.session_factory() as s:
        svc = PaymentLifecycleService(s, app_settings=sandbox_env.settings, now_fn=lambda: sandbox_env.now)
        # Stock is STILL reserved until TTL!
        assert await svc.compute_sellable_stock(3) == 0

    ord_after_timeout = (await ac.get(f"/api/v1/orders/{order['id']}", headers=headers)).json()
    assert ord_after_timeout["status"] == "pending_payment"
    assert ord_after_timeout["payment_status"] == "pending"
    assert len(ord_after_timeout["status_history"]) == 1

    # 2. Explicit cancel releases reservation & is idempotent on repeat cancel
    c1 = await ac.post(
        f"/api/v1/orders/{order['id']}/payment-attempts/{att_1['id']}/cancel",
        headers=headers,
        json={"reason": "Retry fresh attempt"},
    )
    assert c1.status_code == 200
    assert c1.json()["status"] == "cancelled"
    assert c1.json()["reservation_status"] == "released"

    c2 = await ac.post(
        f"/api/v1/orders/{order['id']}/payment-attempts/{att_1['id']}/cancel",
        headers=headers,
    )
    assert c2.status_code == 200
    assert c2.json()["status"] == "cancelled"

    # 3. Fresh attempt settles with succeeded -> stock 2 -> 0 (in_stock=False), order processing/paid
    init_2 = await ac.post(
        f"/api/v1/orders/{order['id']}/payment-attempts",
        headers={**headers, "Idempotency-Key": "life-ik-2"},
    )
    assert init_2.status_code == 201
    att_2 = init_2.json()

    ok_res = await ac.post(
        f"/api/v1/orders/{order['id']}/payment-attempts/{att_2['id']}/sandbox-resolve",
        headers=headers,
        json={
            "outcome": "succeeded",
            "sandbox_token": att_2["next_action"]["sandbox_token"],
        },
    )
    assert ok_res.status_code == 200
    settled = ok_res.json()
    assert settled["status"] == "succeeded"
    assert settled["reservation_status"] == "consumed"
    assert settled["order_status"] == "processing"
    assert settled["order_payment_status"] == "paid"
    assert settled["provider_transaction_id"].startswith("SBX-TXN-")

    ord_paid = (await ac.get(f"/api/v1/orders/{order['id']}", headers=headers)).json()
    assert ord_paid["status"] == "processing"
    assert ord_paid["payment_status"] == "paid"
    assert ord_paid["payment_reference"] == settled["provider_transaction_id"]
    assert ord_paid["stock_reserved"] is True
    assert [h["status"] for h in ord_paid["status_history"]] == [
        "pending_payment",
        "processing",
    ]

    # Succeeded attempt cannot be cancelled -> 409
    assert (
        await ac.post(
            f"/api/v1/orders/{order['id']}/payment-attempts/{att_2['id']}/cancel",
            headers=headers,
        )
    ).status_code == 409

    # Paid order cannot start another payment attempt -> 409
    re_init = await ac.post(
        f"/api/v1/orders/{order['id']}/payment-attempts",
        headers={**headers, "Idempotency-Key": "life-ik-3"},
    )
    assert re_init.status_code == 409
    assert re_init.json()["code"] == "order_already_paid"

    async with sandbox_env.session_factory() as s:
        p3_after = (await s.execute(select(Product).where(Product.id == 3))).scalar_one()
        assert p3_after.stock_quantity == 0
        assert p3_after.in_stock is False
        u = (await s.execute(select(User).where(User.id == user_id))).scalar_one()
        assert u.loyalty_points == 0


@pytest.mark.asyncio
async def test_11_ttl_expiry_frees_stock_and_promo_immediately_without_worker(
    sandbox_env: SandboxTestEnv,
) -> None:
    ac = sandbox_env.client
    async with sandbox_env.session_factory() as s:
        p6 = (await s.execute(select(Product).where(Product.id == 6))).scalar_one()
        p6.stock_quantity = 1
        p6.in_stock = True
        promo = Discount(
            code="TTL1",
            discount_percent=5.0,
            min_order_amount=10.0,
            usage_limit=1,
            used_count=0,
            is_active=True,
        )
        s.add(promo)
        await s.commit()
        promo_id = promo.id

    h1, _ = await register_customer(ac, "ttl-1@arustore.ir", "09128000111")
    h2, _ = await register_customer(ac, "ttl-2@arustore.ir", "09128000112")

    ord_1 = await create_pending_order(
        ac, h1, product_id=6, quantity=1, idempotency_key="ttl-ord-1", promo_code="TTL1"
    )
    ord_2 = await create_pending_order(
        ac, h2, product_id=6, quantity=1, idempotency_key="ttl-ord-2", promo_code="TTL1"
    )

    init_1 = await ac.post(
        f"/api/v1/orders/{ord_1['id']}/payment-attempts",
        headers={**h1, "Idempotency-Key": "ttl-pay-1"},
    )
    assert init_1.status_code == 201

    # Advance past 900s TTL WITHOUT running any worker or touching Order 1
    sandbox_env.advance(901)

    async with sandbox_env.session_factory() as s:
        # Persisted rows on Order 1 have NOT been touched yet (still literally 'active' in DB)
        raw_inv = (
            await s.execute(
                select(InventoryReservation).where(
                    InventoryReservation.order_id == ord_1["id"]
                )
            )
        ).scalar_one()
        assert raw_inv.status == "active"

        # Yet sellable stock and discount capacity are IMMEDIATELY available!
        svc = PaymentLifecycleService(
            s, app_settings=sandbox_env.settings, now_fn=lambda: sandbox_env.now
        )
        assert await svc.compute_sellable_stock(6) == 1
        assert await svc.compute_available_discount_capacity(promo_id) == 1

    # User 2 on Order 2 immediately reserves both the last stock unit and the promo!
    init_2 = await ac.post(
        f"/api/v1/orders/{ord_2['id']}/payment-attempts",
        headers={**h2, "Idempotency-Key": "ttl-pay-2"},
    )
    assert init_2.status_code == 201

    # Querying Order 1's latest attempt lazy-reaps DB state to 'expired' consistently
    get_1 = await ac.get(
        f"/api/v1/orders/{ord_1['id']}/payment-attempts/latest", headers=h1
    )
    assert get_1.status_code == 200
    assert get_1.json()["status"] == "expired"
    assert get_1.json()["reservation_status"] == "expired"

    async with sandbox_env.session_factory() as s:
        reaped_att = (
            await s.execute(
                select(PaymentAttempt).where(PaymentAttempt.id == init_1.json()["id"])
            )
        ).scalar_one()
        assert reaped_att.status == "expired"
        assert reaped_att.active_order_key is None


@pytest.mark.asyncio
async def test_12_concurrent_and_replayed_success_settles_exactly_once(
    sandbox_env: SandboxTestEnv,
) -> None:
    ac = sandbox_env.client
    async with sandbox_env.session_factory() as s:
        p7 = (await s.execute(select(Product).where(Product.id == 7))).scalar_one()
        p7.stock_quantity = 5
        p7.in_stock = True
        promo = Discount(
            code="ONCEONLY",
            discount_percent=10.0,
            min_order_amount=10.0,
            usage_limit=5,
            used_count=0,
            is_active=True,
        )
        s.add(promo)
        await s.commit()
        promo_id = promo.id

    headers, _ = await register_customer(ac, "conc-settle@arustore.ir", "09128000121")
    order = await create_pending_order(
        ac,
        headers,
        product_id=7,
        quantity=2,
        idempotency_key="conc-settle-ord",
        promo_code="ONCEONLY",
    )
    init_res = await ac.post(
        f"/api/v1/orders/{order['id']}/payment-attempts",
        headers={**headers, "Idempotency-Key": "conc-settle-pay"},
    )
    assert init_res.status_code == 201
    att_id = init_res.json()["id"]
    tok = init_res.json()["next_action"]["sandbox_token"]

    # 3 concurrent resolve calls
    r1, r2, r3 = await asyncio.gather(
        ac.post(
            f"/api/v1/orders/{order['id']}/payment-attempts/{att_id}/sandbox-resolve",
            headers=headers,
            json={"outcome": "succeeded", "sandbox_token": tok},
        ),
        ac.post(
            f"/api/v1/orders/{order['id']}/payment-attempts/{att_id}/sandbox-resolve",
            headers=headers,
            json={"outcome": "succeeded", "sandbox_token": tok},
        ),
        ac.post(
            f"/api/v1/orders/{order['id']}/payment-attempts/{att_id}/sandbox-resolve",
            headers=headers,
            json={"outcome": "succeeded", "sandbox_token": tok},
        ),
    )
    for r in (r1, r2, r3):
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "succeeded"

    # Sequential replay also returns 200 OK idempotently
    r4 = await ac.post(
        f"/api/v1/orders/{order['id']}/payment-attempts/{att_id}/sandbox-resolve",
        headers=headers,
        json={"outcome": "succeeded", "sandbox_token": tok},
    )
    assert r4.status_code == 200

    # Contradictory 'failed' outcome after 'succeeded' -> 409 attempt_already_terminal
    contradict = await ac.post(
        f"/api/v1/orders/{order['id']}/payment-attempts/{att_id}/sandbox-resolve",
        headers=headers,
        json={"outcome": "failed", "sandbox_token": tok},
    )
    assert contradict.status_code == 409
    assert contradict.json()["code"] == "attempt_already_terminal"

    async with sandbox_env.session_factory() as s:
        p7_after = (await s.execute(select(Product).where(Product.id == 7))).scalar_one()
        assert p7_after.stock_quantity == 3  # 5 - 2 once!

        disc_after = (
            await s.execute(select(Discount).where(Discount.id == promo_id))
        ).scalar_one()
        assert disc_after.used_count == 1

        usage_cnt = (
            await s.execute(
                select(func.count(DiscountUsage.id)).where(
                    DiscountUsage.order_id == order["id"]
                )
            )
        ).scalar_one()
        assert usage_cnt == 1

        hist_rows = (
            await s.execute(
                select(OrderStatusHistory)
                .where(OrderStatusHistory.order_id == order["id"])
                .order_by(OrderStatusHistory.id.asc())
            )
        ).scalars().all()
        assert [h.status for h in hist_rows] == ["pending_payment", "processing"]


@pytest.mark.asyncio
async def test_13_late_result_amount_mismatch_and_reconciliation_required_flows(
    sandbox_env: SandboxTestEnv,
) -> None:
    ac = sandbox_env.client
    headers, _ = await register_customer(ac, "recon@arustore.ir", "09128000131")
    admin_h = await login_admin(ac)

    # Part A: Pure sandbox late result after TTL expiry -> 409 late_payment_rejected, status='expired'
    ord_exp = await create_pending_order(
        ac, headers, product_id=1, quantity=1, idempotency_key="ord-late-exp"
    )
    init_exp = await ac.post(
        f"/api/v1/orders/{ord_exp['id']}/payment-attempts",
        headers={**headers, "Idempotency-Key": "pay-late-exp"},
    )
    att_exp = init_exp.json()
    sandbox_env.advance(905)

    late_sbx = await ac.post(
        f"/api/v1/orders/{ord_exp['id']}/payment-attempts/{att_exp['id']}/sandbox-resolve",
        headers=headers,
        json={
            "outcome": "succeeded",
            "sandbox_token": att_exp["next_action"]["sandbox_token"],
        },
    )
    assert late_sbx.status_code == 409
    assert late_sbx.json()["code"] == "late_payment_rejected"
    assert (
        await ac.get(
            f"/api/v1/orders/{ord_exp['id']}/payment-attempts/{att_exp['id']}",
            headers=headers,
        )
    ).json()["status"] == "expired"

    # Part B: Injected adapter with mismatched amount + funds_captured_hint=True -> reconciliation_required
    class MismatchedCaptureAdapter(SandboxPaymentAdapter):
        async def verify_attempt(
            self, req: GatewayVerificationRequest
        ) -> GatewayVerificationResult:
            return GatewayVerificationResult(
                outcome="succeeded",
                provider="sandbox",
                provider_transaction_id=f"SBX-MISMATCH-{req.attempt_number}",
                verified_amount_toman=req.expected_amount_toman - 10_000,
                currency_unit="toman",
                funds_captured_hint=True,
            )

    sandbox_env.app.dependency_overrides[get_payment_adapter] = (
        lambda: MismatchedCaptureAdapter(sandbox_env.settings)
    )

    ord_mis = await create_pending_order(
        ac, headers, product_id=2, quantity=1, idempotency_key="ord-mismatch"
    )
    init_mis = await ac.post(
        f"/api/v1/orders/{ord_mis['id']}/payment-attempts",
        headers={**headers, "Idempotency-Key": "pay-mismatch"},
    )
    att_mis = init_mis.json()

    mis_res = await ac.post(
        f"/api/v1/orders/{ord_mis['id']}/payment-attempts/{att_mis['id']}/sandbox-resolve",
        headers=headers,
        json={
            "outcome": "succeeded",
            "sandbox_token": att_mis["next_action"]["sandbox_token"],
        },
    )
    assert mis_res.status_code == 409
    assert mis_res.json()["code"] == "reconciliation_required"

    att_mis_after = (
        await ac.get(
            f"/api/v1/orders/{ord_mis['id']}/payment-attempts/{att_mis['id']}",
            headers=headers,
        )
    ).json()
    assert att_mis_after["status"] == "reconciliation_required"
    assert att_mis_after["reservation_status"] == "released"

    ord_mis_after = (await ac.get(f"/api/v1/orders/{ord_mis['id']}", headers=headers)).json()
    assert ord_mis_after["status"] == "pending_payment"
    assert ord_mis_after["payment_status"] == "pending"
    assert len(ord_mis_after["status_history"]) == 1

    # Part C: Late capture reported AFTER admin cancelled the order -> reconciliation_required, order stays cancelled!
    class LateCaptureAdapter(SandboxPaymentAdapter):
        async def verify_attempt(
            self, req: GatewayVerificationRequest
        ) -> GatewayVerificationResult:
            return GatewayVerificationResult(
                outcome="succeeded",
                provider="sandbox",
                provider_transaction_id=f"SBX-LATECAP-{req.attempt_number}",
                verified_amount_toman=req.expected_amount_toman,
                currency_unit="toman",
                funds_captured_hint=True,
            )

    sandbox_env.app.dependency_overrides[get_payment_adapter] = (
        lambda: LateCaptureAdapter(sandbox_env.settings)
    )

    ord_canc = await create_pending_order(
        ac, headers, product_id=2, quantity=1, idempotency_key="ord-canc-late"
    )
    init_canc = await ac.post(
        f"/api/v1/orders/{ord_canc['id']}/payment-attempts",
        headers={**headers, "Idempotency-Key": "pay-canc-late"},
    )
    att_canc = init_canc.json()

    # Admin cancels order while attempt is pending
    adm_cancel = await ac.patch(
        f"/api/v1/admin/orders/{ord_canc['id']}/status",
        headers=admin_h,
        json={"status": "cancelled", "note": "Cancelled by admin"},
    )
    assert adm_cancel.status_code == 200

    # Late capture arrives after cancellation -> 409 reconciliation_required; order NEVER reopens to processing!
    late_cap_res = await ac.post(
        f"/api/v1/orders/{ord_canc['id']}/payment-attempts/{att_canc['id']}/sandbox-resolve",
        headers=headers,
        json={
            "outcome": "succeeded",
            "sandbox_token": att_canc["next_action"]["sandbox_token"],
        },
    )
    assert late_cap_res.status_code == 409
    assert late_cap_res.json()["code"] == "reconciliation_required"

    ord_canc_after = (
        await ac.get(f"/api/v1/orders/{ord_canc['id']}", headers=headers)
    ).json()
    assert ord_canc_after["status"] == "cancelled"
    assert ord_canc_after["payment_status"] == "pending"

    att_canc_after = (
        await ac.get(
            f"/api/v1/orders/{ord_canc['id']}/payment-attempts/{att_canc['id']}",
            headers=headers,
        )
    ).json()
    assert att_canc_after["status"] == "reconciliation_required"

    sandbox_env.app.dependency_overrides.pop(get_payment_adapter, None)


@pytest.mark.asyncio
async def test_14_admin_cancel_unpaid_releases_in_same_tx_and_paid_cancel_does_not_restock(
    sandbox_env: SandboxTestEnv,
) -> None:
    ac = sandbox_env.client
    admin_h = await login_admin(ac)

    async with sandbox_env.session_factory() as s:
        p8 = (await s.execute(select(Product).where(Product.id == 8))).scalar_one()
        p8.stock_quantity = 2
        p8.in_stock = True
        promo = Discount(
            code="ADMCANC",
            discount_percent=10.0,
            min_order_amount=10.0,
            usage_limit=1,
            used_count=0,
            is_active=True,
        )
        s.add(promo)
        await s.commit()
        promo_id = promo.id
        SessionCls = type(s)

    headers, _ = await register_customer(ac, "adm-cancel@arustore.ir", "09128000141")
    ord_unpaid = await create_pending_order(
        ac,
        headers,
        product_id=8,
        quantity=2,
        idempotency_key="ord-adm-unpaid",
        promo_code="ADMCANC",
    )
    init_u = await ac.post(
        f"/api/v1/orders/{ord_unpaid['id']}/payment-attempts",
        headers={**headers, "Idempotency-Key": "pay-adm-unpaid"},
    )
    assert init_u.status_code == 201
    att_u_id = init_u.json()["id"]

    # 1. Verify single-transaction atomicity: if commit crashes during admin cancel,
    # NEITHER order cancellation NOR reservation release commits separately!
    with patch.object(
        SessionCls, "commit", side_effect=RuntimeError("Simulated commit crash")
    ):
        with pytest.raises(RuntimeError, match="Simulated commit crash"):
            await ac.patch(
                f"/api/v1/admin/orders/{ord_unpaid['id']}/status",
                headers=admin_h,
                json={"status": "cancelled"},
            )

    async with sandbox_env.session_factory() as s:
        att_still_active = (
            await s.execute(select(PaymentAttempt).where(PaymentAttempt.id == att_u_id))
        ).scalar_one()
        assert att_still_active.status == "pending"
        svc = PaymentLifecycleService(
            s, app_settings=sandbox_env.settings, now_fn=lambda: sandbox_env.now
        )
        assert await svc.compute_sellable_stock(8) == 0
        assert await svc.compute_available_discount_capacity(promo_id) == 0

    # 2. Normal admin cancel succeeds atomically and frees all reservations immediately
    cancel_ok = await ac.patch(
        f"/api/v1/admin/orders/{ord_unpaid['id']}/status",
        headers=admin_h,
        json={"status": "cancelled", "note": "Unpaid order cancelled"},
    )
    assert cancel_ok.status_code == 200
    assert cancel_ok.json()["status"] == "cancelled"

    async with sandbox_env.session_factory() as s:
        att_released = (
            await s.execute(select(PaymentAttempt).where(PaymentAttempt.id == att_u_id))
        ).scalar_one()
        assert att_released.status == "cancelled"
        assert att_released.active_order_key is None
        svc = PaymentLifecycleService(
            s, app_settings=sandbox_env.settings, now_fn=lambda: sandbox_env.now
        )
        assert await svc.compute_sellable_stock(8) == 2
        assert await svc.compute_available_discount_capacity(promo_id) == 1

    # 3. Paid order cancelled by admin does NOT automatically restock physical inventory
    ord_paid = await create_pending_order(
        ac, headers, product_id=8, quantity=1, idempotency_key="ord-adm-paid"
    )
    init_p = await ac.post(
        f"/api/v1/orders/{ord_paid['id']}/payment-attempts",
        headers={**headers, "Idempotency-Key": "pay-adm-paid"},
    )
    att_p = init_p.json()
    await ac.post(
        f"/api/v1/orders/{ord_paid['id']}/payment-attempts/{att_p['id']}/sandbox-resolve",
        headers=headers,
        json={
            "outcome": "succeeded",
            "sandbox_token": att_p["next_action"]["sandbox_token"],
        },
    )

    cancel_paid = await ac.patch(
        f"/api/v1/admin/orders/{ord_paid['id']}/status",
        headers=admin_h,
        json={"status": "cancelled", "note": "Cancelled before shipment"},
    )
    assert cancel_paid.status_code == 200
    assert cancel_paid.json()["status"] == "cancelled"
    assert cancel_paid.json()["payment_status"] == "paid"
    assert cancel_paid.json()["stock_reserved"] is False

    async with sandbox_env.session_factory() as s:
        p8_after = (await s.execute(select(Product).where(Product.id == 8))).scalar_one()
        # 2 - 1 = 1 remains (not auto-incremented back to 2 without return/refund workflow)
        assert p8_after.stock_quantity == 1


@pytest.mark.asyncio
async def test_15_reviews_and_analytics_only_count_paid_non_cancelled_orders(
    sandbox_env: SandboxTestEnv,
) -> None:
    ac = sandbox_env.client
    admin_h = await login_admin(ac)
    headers, _ = await register_customer(ac, "rev-ana@arustore.ir", "09128000151")

    order = await create_pending_order(
        ac, headers, product_id=1, quantity=2, idempotency_key="ord-rev-ana-1"
    )

    # 1. While order is unpaid (`pending_payment`): revenue is 0 and review is NOT verified
    dash_unpaid = (
        await ac.get("/api/v1/admin/dashboard", headers=admin_h)
    ).json()["overview"]
    assert dash_unpaid["total_revenue"] == 0.0
    assert dash_unpaid["total_revenue_toman"] == 0
    assert dash_unpaid["orders_by_status"].get("pending_payment", 0) >= 1

    rev_unpaid = await ac.post(
        "/api/v1/reviews/",
        headers=headers,
        json={
            "product_id": 1,
            "rating": 5,
            "title": "نظر قبل از پرداخت",
            "comment": "هنوز پرداخت انجام نشده است.",
        },
    )
    assert rev_unpaid.status_code == 201
    assert rev_unpaid.json()["is_verified_purchase"] is False

    # 2. Settle payment -> revenue reflects paid order and new review IS verified!
    init_res = await ac.post(
        f"/api/v1/orders/{order['id']}/payment-attempts",
        headers={**headers, "Idempotency-Key": "pay-rev-ana-1"},
    )
    att = init_res.json()
    await ac.post(
        f"/api/v1/orders/{order['id']}/payment-attempts/{att['id']}/sandbox-resolve",
        headers=headers,
        json={
            "outcome": "succeeded",
            "sandbox_token": att["next_action"]["sandbox_token"],
        },
    )

    dash_paid = (
        await ac.get("/api/v1/admin/dashboard", headers=admin_h)
    ).json()["overview"]
    assert dash_paid["total_revenue"] == order["total"]
    assert dash_paid["total_revenue_toman"] == order["total_toman"]
    assert dash_paid["orders_by_status"].get("processing", 0) >= 1

    rev_paid = await ac.post(
        "/api/v1/reviews/",
        headers=headers,
        json={
            "product_id": 1,
            "rating": 5,
            "title": "نظر پس از پرداخت قطعی",
            "comment": "ظرف بسیار باکیفیت و خوش‌ساخت است.",
        },
    )
    assert rev_paid.status_code == 201
    assert rev_paid.json()["is_verified_purchase"] is True

    # 3. Cancelling the paid order excludes it from revenue and future verified-purchase checks
    await ac.patch(
        f"/api/v1/admin/orders/{order['id']}/status",
        headers=admin_h,
        json={"status": "cancelled", "note": "Order cancelled"},
    )
    dash_cancelled = (
        await ac.get("/api/v1/admin/dashboard", headers=admin_h)
    ).json()["overview"]
    assert dash_cancelled["total_revenue"] == 0.0
    assert dash_cancelled["total_revenue_toman"] == 0

    rev_after_cancel = await ac.post(
        "/api/v1/reviews/",
        headers=headers,
        json={
            "product_id": 1,
            "rating": 4,
            "title": "پس از لغو سفارش",
            "comment": "بررسی رفتار پس از لغو سفارش.",
        },
    )
    assert rev_after_cancel.status_code == 201
    assert rev_after_cancel.json()["is_verified_purchase"] is False


@pytest.mark.asyncio
async def test_16_adapter_session_init_definitive_vs_indeterminate_outcomes(
    sandbox_env: SandboxTestEnv,
) -> None:
    ac = sandbox_env.client
    headers, _ = await register_customer(ac, "init-faults@arustore.ir", "09128000161")

    order = await create_pending_order(
        ac, headers, product_id=1, quantity=2, idempotency_key="ord-init-fault-1"
    )
    async with sandbox_env.session_factory() as s:
        p1_initial_stock = (
            await s.execute(select(Product.stock_quantity).where(Product.id == 1))
        ).scalar_one()

    # 1. Definitive failure in adapter.create_session -> 502, attempt='failed', reservations immediately released!
    class FailingInitAdapter(SandboxPaymentAdapter):
        async def create_session(
            self, req: GatewaySessionRequest
        ) -> GatewaySessionInitResult:
            return GatewaySessionInitResult(
                outcome="definitive_failure",
                provider="sandbox",
                failure_code="provider_rejected_init",
                failure_reason="Simulated definitive session failure",
            )

    sandbox_env.app.dependency_overrides[get_payment_adapter] = (
        lambda: FailingInitAdapter(sandbox_env.settings)
    )

    fail_init_res = await ac.post(
        f"/api/v1/orders/{order['id']}/payment-attempts",
        headers={**headers, "Idempotency-Key": "pay-init-def-fail"},
    )
    assert fail_init_res.status_code == 502
    assert fail_init_res.json()["code"] == "payment_session_init_failed"

    async with sandbox_env.session_factory() as s:
        svc = PaymentLifecycleService(
            s, app_settings=sandbox_env.settings, now_fn=lambda: sandbox_env.now
        )
        assert await svc.compute_sellable_stock(1) == p1_initial_stock

    latest_failed = (
        await ac.get(
            f"/api/v1/orders/{order['id']}/payment-attempts/latest", headers=headers
        )
    ).json()
    assert latest_failed["status"] == "failed"
    assert latest_failed["reservation_status"] == "released"

    # 2. Indeterminate error in adapter.create_session -> recoverable 'pending' until TTL!
    class IndeterminateInitAdapter(SandboxPaymentAdapter):
        async def create_session(
            self, req: GatewaySessionRequest
        ) -> GatewaySessionInitResult:
            return GatewaySessionInitResult(
                outcome="indeterminate_error",
                provider="sandbox",
                failure_code="network_glitch_on_init",
                failure_reason="Simulated transient session init glitch",
            )

    sandbox_env.app.dependency_overrides[get_payment_adapter] = (
        lambda: IndeterminateInitAdapter(sandbox_env.settings)
    )

    ind_res = await ac.post(
        f"/api/v1/orders/{order['id']}/payment-attempts",
        headers={**headers, "Idempotency-Key": "pay-init-indeterminate"},
    )
    assert ind_res.status_code == 201
    assert ind_res.json()["status"] == "pending"
    assert ind_res.json()["failure_code"] == "network_glitch_on_init"
    assert ind_res.json()["reservation_status"] == "active"

    # Restore normal adapter -> user can still resolve the recoverable pending attempt before TTL!
    sandbox_env.app.dependency_overrides.pop(get_payment_adapter, None)
    resolve_ok = await ac.post(
        f"/api/v1/orders/{order['id']}/payment-attempts/{ind_res.json()['id']}/sandbox-resolve",
        headers=headers,
        json={
            "outcome": "succeeded",
            "sandbox_token": ind_res.json()["next_action"]["sandbox_token"],
        },
    )
    assert resolve_ok.status_code == 200
    assert resolve_ok.json()["status"] == "succeeded"

