from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

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
from app.core.config import settings
from app.core.database import AsyncSessionLocal, Base, engine
from app.core.elasticsearch import es_client
from app.core.redis import cache_manager
from app.services.seed_service import seed_initial_catalog


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    if settings.AUTO_SEED_DEMO_DATA:
        async with AsyncSessionLocal() as session:
            await seed_initial_catalog(session)

    yield

    await cache_manager.close()
    await es_client.close()
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="REST API for AruStore cast & anodized aluminum servingware e-commerce platform.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(
    categories.router, prefix=f"{settings.API_V1_STR}/categories", tags=["categories"]
)
app.include_router(brands.router, prefix=f"{settings.API_V1_STR}/brands", tags=["brands"])
app.include_router(
    products.router, prefix=f"{settings.API_V1_STR}/products", tags=["products"]
)
app.include_router(cart.router, prefix=f"{settings.API_V1_STR}/cart", tags=["cart"])
app.include_router(orders.router, prefix=f"{settings.API_V1_STR}/orders", tags=["orders"])
app.include_router(
    reviews.router, prefix=f"{settings.API_V1_STR}/reviews", tags=["reviews"]
)
app.include_router(
    wishlist.router, prefix=f"{settings.API_V1_STR}/wishlist", tags=["wishlist"]
)
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])
app.include_router(
    analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["analytics"]
)


@app.get("/health", tags=["system"])
@app.get(f"{settings.API_V1_STR}/health", tags=["system"])
async def health_check():
    cache_status = await cache_manager.health()
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "cache": cache_status,
    }
