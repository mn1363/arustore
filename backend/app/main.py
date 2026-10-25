from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import HTMLResponse, JSONResponse

import app.models  # noqa: F401 - register all ORM models on Base.metadata
from app.api.v1.endpoints import (
    admin,
    analytics,
    auth,
    brands,
    cart,
    categories,
    orders,
    products,
    reviews,
    users,
    wishlist,
)
from app.core.config import Settings, settings
from app.core.database import AsyncSessionLocal, Base, engine
from app.core.elasticsearch import es_client
from app.core.redis import cache_manager
from app.services.seed_service import seed_initial_catalog


API_LANDING_HTML = """<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AruStore API v1 — سرویس بک‌اند آرو استور</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0d0e11;
      color: #f2f2f0;
      font-family: Tahoma, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.65;
      padding: 2rem 1.25rem;
    }
    .container { max-width: 960px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }
    .card {
      background: #14161a;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 1.5rem;
    }
    .header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; }
    .badge {
      display: inline-flex; align-items: center; gap: 0.45rem;
      padding: 0.3rem 0.75rem; border-radius: 999px;
      background: rgba(214, 184, 138, 0.14); color: #d6b88a; font-size: 0.8rem; font-weight: 700;
    }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #34d399; }
    h1 { font-size: 1.45rem; color: #f2f2f0; }
    .sub { color: #9ca0ab; font-size: 0.9rem; margin-top: 0.35rem; }
    .links { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 1rem; }
    .btn {
      display: inline-block; text-decoration: none; cursor: pointer;
      padding: 0.55rem 1rem; border-radius: 10px; font-size: 0.82rem; font-weight: 700;
      border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #f2f2f0;
      transition: background 0.15s, border-color 0.15s;
    }
    .btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.22); }
    .btn-primary { background: #d6b88a; color: #111215; border-color: transparent; }
    .btn-primary:hover { background: #e1c79d; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; }
    .ep-btn {
      text-align: left; direction: ltr; padding: 0.7rem 0.9rem; border-radius: 10px;
      background: #0d0e11; border: 1px solid rgba(255,255,255,0.08); color: #e4e6eb;
      cursor: pointer; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.78rem;
    }
    .ep-btn:hover { border-color: #d6b88a; color: #d6b88a; }
    .method { color: #d6b88a; font-weight: 700; margin-right: 0.4rem; }
    pre {
      direction: ltr; text-align: left; background: #090a0d; color: #d4d6dc;
      border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;
      padding: 1rem; font-size: 0.78rem; max-height: 360px; overflow: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .label { font-size: 0.85rem; font-weight: 700; color: #d6b88a; margin-bottom: 0.65rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div>
          <h1>سرویس بک‌اند آرو استور (AruStore FastAPI v1)</h1>
          <p class="sub">سرور API روی پورت 8000 فعال است. (رابط گرافیکی سه‌بعدی فروشگاه روی پورت 3000 اجرا می‌شود.)</p>
        </div>
        <span class="badge"><span class="dot"></span> ONLINE · v1.0.0</span>
      </div>
      <div class="links">
        <a class="btn btn-primary" href="/docs">مستندات تعاملی Swagger (/docs)</a>
        <a class="btn" href="/redoc">مستندات ReDoc (/redoc)</a>
        <a class="btn" href="/openapi.json">فایل OpenAPI JSON</a>
        <a class="btn" href="/health">وضعیت سلامت (/health)</a>
      </div>
    </div>

    <div class="card">
      <div class="label">تست سریع Endpointهای زنده (کلیک کنید):</div>
      <div class="grid">
        <button class="ep-btn" onclick="runGet('/health')"><span class="method">GET</span>/health</button>
        <button class="ep-btn" onclick="runGet('/api/v1/products/?page=1&page_size=4')"><span class="method">GET</span>/api/v1/products/</button>
        <button class="ep-btn" onclick="runGet('/api/v1/categories/')"><span class="method">GET</span>/api/v1/categories/</button>
        <button class="ep-btn" onclick="runGet('/api/v1/brands/')"><span class="method">GET</span>/api/v1/brands/</button>
        <button class="ep-btn" onclick="runGet('/api/v1/reviews/product/1')"><span class="method">GET</span>/api/v1/reviews/product/1</button>
        <button class="ep-btn" onclick="runGet('/api/v1/admin/dashboard')"><span class="method">AUTH</span>/api/v1/admin/dashboard</button>
      </div>
    </div>

    <div class="card">
      <div class="label" id="res-title">پاسخ زنده سرور:</div>
      <pre id="res-box">در حال دریافت وضعیت سلامت سرویس...</pre>
    </div>
  </div>

  <script>
    async function runGet(path) {
      const box = document.getElementById('res-box');
      const title = document.getElementById('res-title');
      title.textContent = 'درخواست: GET ' + path;
      box.textContent = 'Loading...';
      try {
        const res = await fetch(path);
        const data = await res.json();
        title.textContent = 'پاسخ (' + res.status + '): GET ' + path;
        box.textContent = JSON.stringify(data, null, 2);
      } catch (err) {
        box.textContent = String(err);
      }
    }

    runGet('/api/v1/products/?page=1&page_size=3');
  </script>
</body>
</html>
"""


def create_application(app_settings: Settings = settings) -> FastAPI:
    app_settings.validate_production_security()

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        app_settings.validate_production_security()

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        if app_settings.AUTO_SEED_DEMO_DATA and not app_settings.is_production:
            async with AsyncSessionLocal() as session:
                await seed_initial_catalog(session)

        yield

        await cache_manager.close()
        await es_client.close()
        await engine.dispose()

    application = FastAPI(
        title=app_settings.PROJECT_NAME,
        version=app_settings.VERSION,
        description="REST API for AruStore cast & anodized aluminum servingware e-commerce platform.",
        lifespan=lifespan,
    )

    cors_origin_regex = (
        app_settings.CORS_ORIGIN_REGEX
        if app_settings.is_production
        else (app_settings.CORS_ORIGIN_REGEX or r"https://.*\.e2b\.app")
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=app_settings.CORS_ORIGINS,
        allow_origin_regex=cors_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    effective_allowed_hosts = (
        app_settings.ALLOWED_HOSTS
        if app_settings.is_production
        else list(dict.fromkeys([*app_settings.ALLOWED_HOSTS, "*.e2b.app"]))
    )
    application.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=effective_allowed_hosts,
    )

    application.include_router(
        auth.router, prefix=f"{app_settings.API_V1_STR}/auth", tags=["auth"]
    )
    application.include_router(
        users.router, prefix=f"{app_settings.API_V1_STR}/users", tags=["users"]
    )
    application.include_router(
        categories.router,
        prefix=f"{app_settings.API_V1_STR}/categories",
        tags=["categories"],
    )
    application.include_router(
        brands.router, prefix=f"{app_settings.API_V1_STR}/brands", tags=["brands"]
    )
    application.include_router(
        products.router,
        prefix=f"{app_settings.API_V1_STR}/products",
        tags=["products"],
    )
    application.include_router(
        cart.router, prefix=f"{app_settings.API_V1_STR}/cart", tags=["cart"]
    )
    application.include_router(
        orders.router, prefix=f"{app_settings.API_V1_STR}/orders", tags=["orders"]
    )
    application.include_router(
        reviews.router,
        prefix=f"{app_settings.API_V1_STR}/reviews",
        tags=["reviews"],
    )
    application.include_router(
        wishlist.router,
        prefix=f"{app_settings.API_V1_STR}/wishlist",
        tags=["wishlist"],
    )
    application.include_router(
        admin.router, prefix=f"{app_settings.API_V1_STR}/admin", tags=["admin"]
    )
    application.include_router(
        analytics.router,
        prefix=f"{app_settings.API_V1_STR}/analytics",
        tags=["analytics"],
    )

    @application.get("/", include_in_schema=False)
    async def root_landing(request: Request):
        accept = request.headers.get("accept", "")
        if "text/html" in accept:
            return HTMLResponse(content=API_LANDING_HTML, status_code=200)
        return JSONResponse(
            content={
                "service": app_settings.PROJECT_NAME,
                "version": app_settings.VERSION,
                "status": "healthy",
                "docs": "/docs",
                "redoc": "/redoc",
                "openapi": "/openapi.json",
                "api_v1": app_settings.API_V1_STR,
            }
        )

    @application.get("/health", tags=["system"])
    @application.get(f"{app_settings.API_V1_STR}/health", tags=["system"])
    async def health_check():
        cache_status = await cache_manager.health()
        return {
            "status": "healthy",
            "service": app_settings.PROJECT_NAME,
            "version": app_settings.VERSION,
            "cache": cache_status,
        }

    return application


app = create_application(settings)
