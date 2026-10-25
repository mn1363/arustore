from datetime import timedelta
from httpx import AsyncClient
import pytest
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import Settings, settings
from app.core.database import Base, get_db
from app.core.redis import CacheManager, cache_manager
from app.core.security import create_access_token, create_refresh_token
from app.main import app, create_application
from app.models.user import User

STRONG_PROD_SECRET = "prod-secret-9f8e7d6c5b4a392817263544556677889900aabbccddeeff"


def test_production_config_rejects_missing_placeholder_or_short_secret() -> None:
    # Default placeholder secret must fail in production without echoing secret value
    with pytest.raises(ValidationError) as exc_default:
        Settings(
            ENVIRONMENT="production",
            AUTO_SEED_DEMO_DATA=False,
            ALLOWED_HOSTS=["arustore.ir"],
            CORS_ORIGINS=["https://arustore.ir"],
        )
    assert "change-this-secret-key-in-production-env" not in str(exc_default.value)

    # .env.example placeholder secret must also fail without leaking
    env_example_placeholder = "your-super-secret-key-change-this-in-production"
    with pytest.raises(ValidationError) as exc_placeholder:
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY=env_example_placeholder,
            AUTO_SEED_DEMO_DATA=False,
            ALLOWED_HOSTS=["arustore.ir"],
            CORS_ORIGINS=["https://arustore.ir"],
        )
    assert env_example_placeholder not in str(exc_placeholder.value)

    # Short secret (<32 chars) must fail without echoing the secret
    short_secret = "too-short-secret-value-12345"
    with pytest.raises(ValidationError) as exc_short:
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY=short_secret,
            AUTO_SEED_DEMO_DATA=False,
            ALLOWED_HOSTS=["arustore.ir"],
            CORS_ORIGINS=["https://arustore.ir"],
        )
    assert short_secret not in str(exc_short.value)


def test_production_config_rejects_demo_seeding_and_broad_host_or_cors() -> None:
    with pytest.raises(ValidationError):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY=STRONG_PROD_SECRET,
            AUTO_SEED_DEMO_DATA=True,
            ALLOWED_HOSTS=["arustore.ir"],
            CORS_ORIGINS=["https://arustore.ir"],
        )

    with pytest.raises(ValidationError):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY=STRONG_PROD_SECRET,
            AUTO_SEED_DEMO_DATA=False,
            ALLOWED_HOSTS=["*"],
            CORS_ORIGINS=["https://arustore.ir"],
        )

    with pytest.raises(ValidationError):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY=STRONG_PROD_SECRET,
            AUTO_SEED_DEMO_DATA=False,
            ALLOWED_HOSTS=["arustore.ir"],
            CORS_ORIGINS=["*"],
        )

    with pytest.raises(ValidationError):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY=STRONG_PROD_SECRET,
            AUTO_SEED_DEMO_DATA=False,
            ALLOWED_HOSTS=["arustore.ir"],
            CORS_ORIGINS=["https://arustore.ir"],
            CORS_ORIGIN_REGEX=r"https://.*\.e2b\.app",
        )


async def test_production_config_accepts_valid_settings_and_enforces_hosts_and_cors() -> None:
    prod_settings = Settings(
        ENVIRONMENT="production",
        SECRET_KEY=STRONG_PROD_SECRET,
        ALLOWED_HOSTS=["api.arustore.ir"],
        CORS_ORIGINS=["https://arustore.ir"],
    )
    assert prod_settings.is_production is True
    assert prod_settings.AUTO_SEED_DEMO_DATA is False
    assert prod_settings.REFRESH_COOKIE_SECURE is True
    assert STRONG_PROD_SECRET not in repr(prod_settings)

    prod_app = create_application(prod_settings)

    # Untrusted Host header must be rejected with 400
    async with AsyncClient(app=prod_app, base_url="http://evil.example.com") as bad_client:
        untrusted = await bad_client.get("/health")
        assert untrusted.status_code == 400

    # Explicitly configured host succeeds; sandbox e2b origin is NOT granted CORS credentials
    async with AsyncClient(app=prod_app, base_url="http://api.arustore.ir") as ok_client:
        healthy = await ok_client.get(
            "/health",
            headers={"Origin": "https://3000-sandbox.e2b.app"},
        )
        assert healthy.status_code == 200
        assert "access-control-allow-origin" not in healthy.headers

        allowed_cors = await ok_client.get(
            "/health",
            headers={"Origin": "https://arustore.ir"},
        )
        assert allowed_cors.status_code == 200
        assert (
            allowed_cors.headers.get("access-control-allow-origin")
            == "https://arustore.ir"
        )


async def test_production_lifespan_does_not_seed_demo_data(
    tmp_path, monkeypatch: pytest.MonkeyPatch
) -> None:
    db_file = tmp_path / "prod_empty_boot.sqlite"
    prod_engine = create_async_engine(
        f"sqlite+aiosqlite:///{db_file}",
        connect_args={"check_same_thread": False},
    )
    ProdSessionLocal = async_sessionmaker(
        prod_engine, class_=AsyncSession, expire_on_commit=False
    )
    monkeypatch.setattr("app.main.engine", prod_engine)
    monkeypatch.setattr("app.main.AsyncSessionLocal", ProdSessionLocal)

    prod_settings = Settings(
        ENVIRONMENT="production",
        SECRET_KEY=STRONG_PROD_SECRET,
        ALLOWED_HOSTS=["api.arustore.ir"],
        CORS_ORIGINS=["https://arustore.ir"],
    )
    prod_app = create_application(prod_settings)

    try:
        async with prod_app.router.lifespan_context(prod_app):
            async with ProdSessionLocal() as check_session:
                seeded_users = (await check_session.execute(select(User))).scalars().all()
                assert seeded_users == []
    finally:
        await prod_engine.dispose()


async def test_registration_persists_non_admin_db_user_and_login_validates_credentials(
    tmp_path,
) -> None:
    db_file = tmp_path / "auth_real_db.sqlite"
    test_engine = create_async_engine(
        f"sqlite+aiosqlite:///{db_file}",
        connect_args={"check_same_thread": False},
    )
    SessionLocal = async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async def override_get_db():
        async with SessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    try:
        async with AsyncClient(app=app, base_url="http://testserver") as ac:
            # Weak password fails validation (422)
            weak_res = await ac.post(
                "/api/v1/auth/register",
                json={
                    "email": "mina@arustore.ir",
                    "full_name": "مینا کریمی",
                    "password": "short",
                },
            )
            assert weak_res.status_code == 422

            # Valid registration creates real DB user with is_admin=False and sets HttpOnly cookie
            reg_res = await ac.post(
                "/api/v1/auth/register",
                json={
                    "email": "mina@arustore.ir",
                    "full_name": "مینا کریمی",
                    "password": "MinaStrongPassword123!",
                },
            )
            assert reg_res.status_code == 201
            reg_body = reg_res.json()
            assert reg_body["user"]["email"] == "mina@arustore.ir"
            assert reg_body["user"]["is_admin"] is False
            set_cookie_hdr = reg_res.headers.get("set-cookie", "")
            assert settings.REFRESH_COOKIE_NAME in set_cookie_hdr
            assert "HttpOnly" in set_cookie_hdr

            # Verify directly in SQLite database
            async with SessionLocal() as verify_session:
                db_user = (
                    await verify_session.execute(
                        select(User).where(User.email == "mina@arustore.ir")
                    )
                ).scalar_one_or_none()
                assert db_user is not None
                assert db_user.is_admin is False
                assert db_user.password_hash != "MinaStrongPassword123!"

            # Duplicate email fails with 409
            dup_res = await ac.post(
                "/api/v1/auth/register",
                json={
                    "email": "mina@arustore.ir",
                    "full_name": "مینا کریمی",
                    "password": "MinaStrongPassword123!",
                },
            )
            assert dup_res.status_code == 409

            # Wrong password fails with 401
            bad_login = await ac.post(
                "/api/v1/auth/login/json",
                json={
                    "email_or_username": "mina@arustore.ir",
                    "password": "WrongPassword999!",
                },
            )
            assert bad_login.status_code == 401

            # Unknown user fails with 401
            unknown_login = await ac.post(
                "/api/v1/auth/login/json",
                json={
                    "email_or_username": "nobody@arustore.ir",
                    "password": "MinaStrongPassword123!",
                },
            )
            assert unknown_login.status_code == 401

            # Valid credentials succeed with 200
            good_login = await ac.post(
                "/api/v1/auth/login/json",
                json={
                    "email_or_username": "mina@arustore.ir",
                    "password": "MinaStrongPassword123!",
                },
            )
            assert good_login.status_code == 200
            assert good_login.json()["user"]["is_admin"] is False
    finally:
        app.dependency_overrides.clear()
        await test_engine.dispose()


async def test_admin_endpoints_enforce_401_anonymous_and_403_normal_user(
    client: AsyncClient,
) -> None:
    protected_admin_routes = [
        ("GET", "/api/v1/admin/dashboard"),
        ("GET", "/api/v1/admin/orders"),
        ("GET", "/api/v1/admin/users"),
        ("GET", "/api/v1/analytics/overview"),
    ]

    # 1. Anonymous requests must get 401
    for method, url in protected_admin_routes:
        anon_res = await client.request(method, url)
        assert anon_res.status_code == 401, f"Expected 401 on {url}, got {anon_res.status_code}"

    # 2. Authenticated non-admin customer must get 403
    customer_login = await client.post(
        "/api/v1/auth/login/json",
        json={"email_or_username": "arian@arustore.ir", "password": "Arian1234!"},
    )
    assert customer_login.status_code == 200
    assert customer_login.json()["user"]["is_admin"] is False
    customer_headers = {
        "Authorization": f"Bearer {customer_login.json()['access_token']}"
    }

    for method, url in protected_admin_routes:
        forbidden_res = await client.request(method, url, headers=customer_headers)
        assert (
            forbidden_res.status_code == 403
        ), f"Expected 403 on {url}, got {forbidden_res.status_code}"

    # Admin write endpoint (product creation) must also return 403 for non-admin
    prod_write = await client.post(
        "/api/v1/products/",
        headers=customer_headers,
        json={"sku": "ARU-NOPE"},
    )
    assert prod_write.status_code == 403


async def test_browser_register_and_login_set_httponly_cookie_without_json_refresh_token(
    client: AsyncClient,
) -> None:
    expected_browser_keys = {"access_token", "token_type", "expires_in", "user"}

    # 1. Browser Registration: sets HttpOnly cookie and NEVER returns refresh_token in JSON
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "parisa.p0a1@arustore.ir",
            "full_name": "پریسا احمدی",
            "password": "StrongBrowserPassword123!",
        },
    )
    assert reg_res.status_code == 201
    reg_json = reg_res.json()
    assert set(reg_json.keys()) == expected_browser_keys
    assert "refresh_token" not in reg_json
    reg_cookie = reg_res.cookies.get(settings.REFRESH_COOKIE_NAME)
    assert reg_cookie
    assert reg_cookie not in reg_res.text
    reg_set_cookie = reg_res.headers.get("set-cookie", "")
    assert "HttpOnly" in reg_set_cookie
    assert "Path=/api/v1/auth" in reg_set_cookie
    assert "SameSite=lax" in reg_set_cookie

    # 2. Browser JSON Login: sets HttpOnly cookie and NEVER returns refresh_token in JSON
    json_login_res = await client.post(
        "/api/v1/auth/login/json",
        json={
            "email_or_username": "parisa.p0a1@arustore.ir",
            "password": "StrongBrowserPassword123!",
        },
    )
    assert json_login_res.status_code == 200
    json_login_body = json_login_res.json()
    assert set(json_login_body.keys()) == expected_browser_keys
    assert "refresh_token" not in json_login_body
    login_cookie = json_login_res.cookies.get(settings.REFRESH_COOKIE_NAME)
    assert login_cookie
    assert login_cookie not in json_login_res.text
    assert "HttpOnly" in json_login_res.headers.get("set-cookie", "")

    # 3. OAuth2 Form Login: sets HttpOnly cookie and NEVER returns refresh_token in JSON
    form_login_res = await client.post(
        "/api/v1/auth/login",
        data={
            "username": "parisa.p0a1@arustore.ir",
            "password": "StrongBrowserPassword123!",
        },
    )
    assert form_login_res.status_code == 200
    form_login_body = form_login_res.json()
    assert set(form_login_body.keys()) == expected_browser_keys
    assert "refresh_token" not in form_login_body
    form_cookie = form_login_res.cookies.get(settings.REFRESH_COOKIE_NAME)
    assert form_cookie
    assert form_cookie not in form_login_res.text
    assert "HttpOnly" in form_login_res.headers.get("set-cookie", "")


async def test_refresh_cookie_rotation_reuse_prevention_and_full_session_logout(
    client: AsyncClient,
) -> None:
    expected_browser_keys = {"access_token", "token_type", "expires_in", "user"}

    login_res = await client.post(
        "/api/v1/auth/login/json",
        json={"email_or_username": "arian@arustore.ir", "password": "Arian1234!"},
    )
    assert login_res.status_code == 200
    first_body = login_res.json()
    assert set(first_body.keys()) == expected_browser_keys
    assert "refresh_token" not in first_body
    first_cookie = login_res.cookies.get(settings.REFRESH_COOKIE_NAME)
    assert first_cookie
    assert first_cookie not in login_res.text

    # Calling /api/v1/auth/refresh without cookie (even with JSON body) must fail with 401
    client.cookies.clear()
    no_cookie_res = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": first_cookie},
    )
    assert no_cookie_res.status_code == 401

    # Cookie-based refresh rotates HttpOnly cookie and omits refresh_token from JSON
    cookie_refresh_res = await client.post(
        "/api/v1/auth/refresh",
        cookies={settings.REFRESH_COOKIE_NAME: first_cookie},
    )
    assert cookie_refresh_res.status_code == 200
    second_body = cookie_refresh_res.json()
    assert set(second_body.keys()) == expected_browser_keys
    assert "refresh_token" not in second_body
    second_access = second_body["access_token"]
    second_cookie = cookie_refresh_res.cookies.get(settings.REFRESH_COOKIE_NAME)
    assert second_cookie
    assert second_cookie != first_cookie
    assert second_cookie not in cookie_refresh_res.text
    assert first_cookie not in cookie_refresh_res.text
    assert "HttpOnly" in cookie_refresh_res.headers.get("set-cookie", "")

    # Reusing the rotated first refresh cookie must fail with 401 on both endpoints
    client.cookies.clear()
    reused_cookie_res = await client.post(
        "/api/v1/auth/refresh",
        cookies={settings.REFRESH_COOKIE_NAME: first_cookie},
    )
    assert reused_cookie_res.status_code == 401

    reused_body_res = await client.post(
        "/api/v1/auth/token/refresh",
        json={"refresh_token": first_cookie},
    )
    assert reused_body_res.status_code == 401

    # Logout clears the HttpOnly cookie and revokes BOTH access token AND refresh session
    logout_res = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {second_access}"},
        cookies={settings.REFRESH_COOKIE_NAME: second_cookie},
    )
    assert logout_res.status_code == 200
    logout_set_cookie = logout_res.headers.get("set-cookie", "")
    assert settings.REFRESH_COOKIE_NAME in logout_set_cookie
    assert "Max-Age=0" in logout_set_cookie or '=""' in logout_set_cookie

    # Revoked access token fails on /users/me
    me_after_logout = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {second_access}"},
    )
    assert me_after_logout.status_code == 401

    # Replaying the logged-out refresh token fails on both cookie and programmatic endpoints
    client.cookies.clear()
    cookie_refresh_after_logout = await client.post(
        "/api/v1/auth/refresh",
        cookies={settings.REFRESH_COOKIE_NAME: second_cookie},
    )
    assert cookie_refresh_after_logout.status_code == 401

    token_refresh_after_logout = await client.post(
        "/api/v1/auth/token/refresh",
        json={"refresh_token": second_cookie},
    )
    assert token_refresh_after_logout.status_code == 401


async def test_non_browser_api_token_contract_is_explicit_and_cookie_isolated(
    client: AsyncClient,
) -> None:
    # 1. Explicit programmatic login (/auth/token) returns TokenResponse and sets NO cookie
    tok_res = await client.post(
        "/api/v1/auth/token",
        json={"email_or_username": "arian@arustore.ir", "password": "Arian1234!"},
    )
    assert tok_res.status_code == 200
    assert "set-cookie" not in tok_res.headers
    tok_body = tok_res.json()
    assert set(tok_body.keys()) == {
        "access_token",
        "refresh_token",
        "token_type",
        "expires_in",
        "user",
    }
    first_refresh = tok_body["refresh_token"]

    # 2. /auth/token/refresh ignores cookies if JSON body is omitted (prevents browser XSS cookie abuse)
    cookie_only_attempt = await client.post(
        "/api/v1/auth/token/refresh",
        cookies={settings.REFRESH_COOKIE_NAME: first_refresh},
    )
    assert cookie_only_attempt.status_code == 422

    # 3. Explicit JSON body refresh rotates token pair and sets NO cookie
    rot_res = await client.post(
        "/api/v1/auth/token/refresh",
        json={"refresh_token": first_refresh},
    )
    assert rot_res.status_code == 200
    assert "set-cookie" not in rot_res.headers
    rot_body = rot_res.json()
    second_access = rot_body["access_token"]
    second_refresh = rot_body["refresh_token"]
    assert second_refresh != first_refresh

    # Old refresh token cannot be reused
    reuse_attempt = await client.post(
        "/api/v1/auth/token/refresh",
        json={"refresh_token": first_refresh},
    )
    assert reuse_attempt.status_code == 401

    # 4. Headless logout revokes both access and refresh tokens
    out_res = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {second_access}"},
        json={"refresh_token": second_refresh},
    )
    assert out_res.status_code == 200

    after_out = await client.post(
        "/api/v1/auth/token/refresh",
        json={"refresh_token": second_refresh},
    )
    assert after_out.status_code == 401


async def test_expired_and_malformed_tokens_return_controlled_401_errors(
    client: AsyncClient,
) -> None:
    # Malformed token strings
    malformed_me = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer not.a.jwt"},
    )
    assert malformed_me.status_code == 401

    malformed_cookie_refresh = await client.post(
        "/api/v1/auth/refresh",
        cookies={settings.REFRESH_COOKIE_NAME: "malformed-token"},
    )
    assert malformed_cookie_refresh.status_code == 401

    malformed_body_refresh = await client.post(
        "/api/v1/auth/token/refresh",
        json={"refresh_token": "malformed-token"},
    )
    assert malformed_body_refresh.status_code == 401

    malformed_logout = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": "Bearer malformed-token"},
    )
    assert malformed_logout.status_code == 401

    # Expired access & refresh tokens
    expired_access = create_access_token(
        {"sub": "1", "email": "admin@arustore.ir", "sid": "exp-sid"},
        expires_delta=timedelta(seconds=-10),
    )
    expired_refresh = create_refresh_token(
        {"sub": "1", "email": "admin@arustore.ir", "sid": "exp-sid"},
        expires_delta=timedelta(seconds=-10),
    )

    exp_me = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {expired_access}"},
    )
    assert exp_me.status_code == 401

    exp_cookie_ref = await client.post(
        "/api/v1/auth/refresh",
        cookies={settings.REFRESH_COOKIE_NAME: expired_refresh},
    )
    assert exp_cookie_ref.status_code == 401

    exp_body_ref = await client.post(
        "/api/v1/auth/token/refresh",
        json={"refresh_token": expired_refresh},
    )
    assert exp_body_ref.status_code == 401

    # Valid signature with non-numeric `sub` must return 401, never 500 ValueError
    non_int_sub_access = create_access_token(
        {"sub": "not-an-integer", "email": "x@arustore.ir", "sid": "bad-sub"}
    )
    non_int_sub_refresh = create_refresh_token(
        {"sub": "not-an-integer", "email": "x@arustore.ir", "sid": "bad-sub"}
    )

    bad_sub_me = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {non_int_sub_access}"},
    )
    assert bad_sub_me.status_code == 401

    bad_sub_ref = await client.post(
        "/api/v1/auth/refresh",
        cookies={settings.REFRESH_COOKIE_NAME: non_int_sub_refresh},
    )
    assert bad_sub_ref.status_code == 401

    # Refresh token presented as Bearer access token must fail with 401
    valid_refresh_wrong_use = create_refresh_token(
        {"sub": "1", "email": "admin@arustore.ir", "sid": "wrong-type"}
    )
    wrong_type_me = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {valid_refresh_wrong_use}"},
    )
    assert wrong_type_me.status_code == 401


async def test_redis_failure_in_production_fails_closed_without_memory_fallback(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    login_res = await client.post(
        "/api/v1/auth/login/json",
        json={"email_or_username": "arian@arustore.ir", "password": "Arian1234!"},
    )
    assert login_res.status_code == 200
    access = login_res.json()["access_token"]
    refresh_cookie = login_res.cookies.get(settings.REFRESH_COOKIE_NAME)
    assert refresh_cookie

    # Point a fresh CacheManager at an unreachable Redis port while ENVIRONMENT=production
    unreachable_cache = CacheManager("redis://127.0.0.1:63999/0")
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr("app.api.deps.cache_manager", unreachable_cache)
    monkeypatch.setattr("app.services.auth_service.cache_manager", unreachable_cache)

    # 1. Logout cannot silently fall back to process-local memory in production
    logout_res = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {access}"},
    )
    assert logout_res.status_code == 503
    assert unreachable_cache._memory_store == {}

    # 2. Protected endpoints & cookie/token refresh fail closed (503) instead of bypassing revocation
    me_res = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {access}"},
    )
    assert me_res.status_code == 503

    ref_res = await client.post(
        "/api/v1/auth/refresh",
        cookies={settings.REFRESH_COOKIE_NAME: refresh_cookie},
    )
    assert ref_res.status_code == 503

    await unreachable_cache.close()
    assert cache_manager is not unreachable_cache
