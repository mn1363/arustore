# Save as setup-project.ps1 with UTF-8 without BOM encoding
Write-Host "AruStore Project Setup" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

# Create project structure
$projectRoot = "F:\MOSTAFA Project\arustore"
Set-Location $projectRoot

Write-Host "Creating project structure..." -ForegroundColor Yellow

# Create directories
New-Item -ItemType Directory -Force -Path "backend/app/api/v1/endpoints" | Out-Null
New-Item -ItemType Directory -Force -Path "backend/app/core" | Out-Null
New-Item -ItemType Directory -Force -Path "backend/app/models" | Out-Null
New-Item -ItemType Directory -Force -Path "backend/app/schemas" | Out-Null
New-Item -ItemType Directory -Force -Path "backend/app/services" | Out-Null
New-Item -ItemType Directory -Force -Path "backend/app/tasks" | Out-Null
New-Item -ItemType Directory -Force -Path "backend/app/utils" | Out-Null
New-Item -ItemType Directory -Force -Path "backend/migrations" | Out-Null
New-Item -ItemType Directory -Force -Path "backend/tests" | Out-Null

New-Item -ItemType Directory -Force -Path "frontend/app/(auth)/login" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/app/(auth)/register" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/app/(main)/products" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/app/(main)/product/[slug]" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/app/(main)/cart" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/app/(main)/checkout" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/app/(main)/orders" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/app/(main)/profile" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/app/(main)/wishlist" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/app/(main)/categories" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/app/(admin)/admin/products" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/app/(admin)/admin/categories" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/app/(admin)/admin/brands" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/app/(admin)/admin/orders" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/app/(admin)/admin/users" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/app/(admin)/admin/discounts" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/app/(admin)/admin/analytics" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/components/ui" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/components/layout" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/components/product" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/components/cart" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/components/checkout" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/components/filters" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/components/common" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/hooks" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/lib/api" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/lib/store" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/lib/utils" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/lib/validators" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/styles" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/public/icons" | Out-Null
New-Item -ItemType Directory -Force -Path "frontend/public/images" | Out-Null
New-Item -ItemType Directory -Force -Path "nginx/conf.d" | Out-Null
New-Item -ItemType Directory -Force -Path "nginx/ssl" | Out-Null

Write-Host "Directory structure created!" -ForegroundColor Green

# Create __init__.py files
New-Item -ItemType File -Force -Path "backend/app/__init__.py" | Out-Null
New-Item -ItemType File -Force -Path "backend/app/api/__init__.py" | Out-Null
New-Item -ItemType File -Force -Path "backend/app/api/v1/__init__.py" | Out-Null
New-Item -ItemType File -Force -Path "backend/app/api/v1/endpoints/__init__.py" | Out-Null

Write-Host "Python init files created!" -ForegroundColor Green

# Create all necessary backend files
Write-Host "Creating backend files..." -ForegroundColor Yellow

# Create main.py
@"
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.endpoints import (
    auth, products, categories, brands, cart, 
    orders, users, reviews, wishlist, admin, analytics
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
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
app.include_router(products.router, prefix=f"{settings.API_V1_STR}/products", tags=["products"])
app.include_router(categories.router, prefix=f"{settings.API_V1_STR}/categories", tags=["categories"])
app.include_router(brands.router, prefix=f"{settings.API_V1_STR}/brands", tags=["brands"])
app.include_router(cart.router, prefix=f"{settings.API_V1_STR}/cart", tags=["cart"])
app.include_router(orders.router, prefix=f"{settings.API_V1_STR}/orders", tags=["orders"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(reviews.router, prefix=f"{settings.API_V1_STR}/reviews", tags=["reviews"])
app.include_router(wishlist.router, prefix=f"{settings.API_V1_STR}/wishlist", tags=["wishlist"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["analytics"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.VERSION}
"@ | Out-File -FilePath "backend/app/main.py" -Encoding UTF8

# Create config.py
@"
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "AruStore"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "your-super-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    DATABASE_URL: str = "postgresql://aruadmin:securepassword123@postgres:5432/arustore"
    REDIS_URL: str = "redis://:redispassword123@redis:6379/0"
    ELASTICSEARCH_URL: str = "http://elasticsearch:9200"
    
    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin123"
    MINIO_BUCKET: str = "arustore"
    
    CELERY_BROKER_URL: str = "amqp://aruuser:arupassword123@rabbitmq:5672//"
    CELERY_RESULT_BACKEND: str = "redis://:redispassword123@redis:6379/1"
    
    PAYMENT_GATEWAY_KEY: str = "sandbox_key"
    PAYMENT_GATEWAY_SECRET: str = "sandbox_secret"
    
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    class Config:
        env_file = ".env"

settings = Settings()
"@ | Out-File -FilePath "backend/app/core/config.py" -Encoding UTF8

# Create database.py
@"
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
    echo=True,
    pool_size=20,
    max_overflow=40,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
"@ | Out-File -FilePath "backend/app/core/database.py" -Encoding UTF8

# Create security.py
@"
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return {}
"@ | Out-File -FilePath "backend/app/core/security.py" -Encoding UTF8

# Create celery_app.py
@"
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "arustore",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks.email_tasks", "app.tasks.search_tasks", "app.tasks.analytics_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,
    task_soft_time_limit=25 * 60,
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=100,
)
"@ | Out-File -FilePath "backend/app/core/celery_app.py" -Encoding UTF8

# Create base.py model
@"
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()
"@ | Out-File -FilePath "backend/app/models/base.py" -Encoding UTF8

# Create user.py model
@"
from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(200), nullable=False)
    avatar = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)
    preferences = Column(JSON, default={})
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    addresses = relationship("Address", back_populates="user")
    orders = relationship("Order", back_populates="user")
    reviews = relationship("Review", back_populates="user")
    cart_items = relationship("CartItem", back_populates="user")
    wishlist_items = relationship("WishlistItem", back_populates="user")
"@ | Out-File -FilePath "backend/app/models/user.py" -Encoding UTF8

# Create product.py model
@"
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey, DateTime, JSON, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base

product_category = Table(
    "product_category",
    Base.metadata,
    Column("product_id", Integer, ForeignKey("products.id")),
    Column("category_id", Integer, ForeignKey("categories.id"))
)
"@ | Out-File -FilePath "backend/app/models/product.py" -Encoding UTF8

# Create auth endpoints
@"
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, TokenResponse
from app.services.auth_service import AuthService

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    return await auth_service.register_user(user_data)

@router.post("/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    return await auth_service.login_user(form_data.username, form_data.password)

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: str, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    return await auth_service.refresh_token(refresh_token)

@router.post("/logout")
async def logout(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    await auth_service.logout_user(token)
    return {"message": "Logged out successfully"}
"@ | Out-File -FilePath "backend/app/api/v1/endpoints/auth.py" -Encoding UTF8

# Create products endpoints
@"
from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.product_service import ProductService
from app.schemas.product import ProductCreate, ProductUpdate, ProductFilter
from app.api.deps import get_current_user, get_current_admin

router = APIRouter()

@router.get("/")
async def get_products(
    category_id: Optional[int] = Query(None),
    brand_id: Optional[int] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    in_stock: Optional[bool] = Query(None),
    is_on_sale: Optional[bool] = Query(None),
    sort_by: Optional[str] = Query("newest"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    filters = ProductFilter(
        category_id=category_id,
        brand_id=brand_id,
        min_price=min_price,
        max_price=max_price,
        search=search,
        in_stock=in_stock,
        is_on_sale=is_on_sale,
        sort_by=sort_by
    )
    service = ProductService(db)
    return await service.list_products(filters, page, page_size)

@router.get("/{product_id}")
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    service = ProductService(db)
    product = await service.get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
"@ | Out-File -FilePath "backend/app/api/v1/endpoints/products.py" -Encoding UTF8

# Create requirements.txt
@"
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
asyncpg==0.29.0
psycopg2-binary==2.9.9
pydantic==2.5.0
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
elasticsearch==8.11.0
redis==5.0.1
celery==5.3.4
flower==2.0.0
boto3==1.34.0
pillow==10.1.0
unidecode==1.3.7
email-validator==2.1.0
alembic==1.12.1
python-dotenv==1.0.0
httpx==0.25.0
pytest==7.4.3
pytest-asyncio==0.21.1
"@ | Out-File -FilePath "backend/requirements.txt" -Encoding UTF8

# Create Dockerfile for backend
@"
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \\
    gcc \\
    libpq-dev \\
    curl \\
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN useradd -m -u 1000 aruuser && chown -R aruuser:aruuser /app
USER aruuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
"@ | Out-File -FilePath "backend/Dockerfile" -Encoding UTF8

# Create .env for backend
@"
DATABASE_URL=postgresql://aruadmin:securepassword123@postgres:5432/arustore
REDIS_URL=redis://:redispassword123@redis:6379/0
ELASTICSEARCH_URL=http://elasticsearch:9200
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=arustore
CELERY_BROKER_URL=amqp://aruuser:arupassword123@rabbitmq:5672//
CELERY_RESULT_BACKEND=redis://:redispassword123@redis:6379/1
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
PAYMENT_GATEWAY_KEY=sandbox_key
PAYMENT_GATEWAY_SECRET=sandbox_secret
CORS_ORIGINS=["http://localhost:3000","http://localhost:3001"]
"@ | Out-File -FilePath "backend/.env" -Encoding UTF8

Write-Host "Backend files created!" -ForegroundColor Green

# Create frontend files
Write-Host "Creating frontend files..." -ForegroundColor Yellow

# Create package.json
@"
{
  "name": "arustore-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.3.2",
    "@tanstack/react-query": "^5.8.4",
    "axios": "^1.6.2",
    "framer-motion": "^10.16.4",
    "lucide-react": "^0.294.0",
    "next": "14.0.3",
    "next-pwa": "^5.6.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.47.0",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.54.0",
    "eslint-config-next": "14.0.3",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.3.2"
  }
}
"@ | Out-File -FilePath "frontend/package.json" -Encoding UTF8

# Create next.config.js
@"
/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig = {
  images: {
    domains: ['localhost', 'minio.arustore.com'],
    formats: ['image/avif', 'image/webp'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  swcMinify: true,
  reactStrictMode: true,
}

module.exports = withPWA(nextConfig)
"@ | Out-File -FilePath "frontend/next.config.js" -Encoding UTF8

# Create Dockerfile for frontend
@"
FROM node:20-alpine AS deps

WORKDIR /app
COPY package.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
"@ | Out-File -FilePath "frontend/Dockerfile" -Encoding UTF8

Write-Host "Frontend files created!" -ForegroundColor Green

# Create docker-compose.yml
Write-Host "Creating docker-compose.yml..." -ForegroundColor Yellow

@"
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: arustore-postgres
    environment:
      POSTGRES_USER: aruadmin
      POSTGRES_PASSWORD: securepassword123
      POSTGRES_DB: arustore
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aruadmin"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - arustore-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: arustore-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --requirepass redispassword123
    healthcheck:
      test: ["CMD", "redis-cli", "--pass", "redispassword123", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - arustore-network
    restart: unless-stopped

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: arustore-elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
    ports:
      - "9200:9200"
      - "9300:9300"
    volumes:
      - es_data:/usr/share/elasticsearch/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9200/_cluster/health?wait_for_status=yellow&timeout=50s"]
      interval: 30s
      timeout: 20s
      retries: 10
    networks:
      - arustore-network
    restart: unless-stopped
    ulimits:
      memlock:
        soft: -1
        hard: -1
      nofile:
        soft: 65536
        hard: 65536

  minio:
    image: minio/minio:latest
    container_name: arustore-minio
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 5
    networks:
      - arustore-network
    restart: unless-stopped

  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: arustore-rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: aruuser
      RABBITMQ_DEFAULT_PASS: arupassword123
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "check_running"]
      interval: 30s
      timeout: 10s
      retries: 5
    networks:
      - arustore-network
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: arustore-backend
    environment:
      - DATABASE_URL=postgresql://aruadmin:securepassword123@postgres:5432/arustore
      - REDIS_URL=redis://:redispassword123@redis:6379/0
      - ELASTICSEARCH_URL=http://elasticsearch:9200
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=minioadmin
      - MINIO_SECRET_KEY=minioadmin123
      - CELERY_BROKER_URL=amqp://aruuser:arupassword123@rabbitmq:5672//
      - CELERY_RESULT_BACKEND=redis://:redispassword123@redis:6379/1
      - SECRET_KEY=your-super-secret-key-change-this-in-production
      - CORS_ORIGINS=["http://localhost:3000"]
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      elasticsearch:
        condition: service_healthy
      minio:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/__pycache__
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    networks:
      - arustore-network
    restart: unless-stopped

  celery-worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: arustore-celery-worker
    environment:
      - DATABASE_URL=postgresql://aruadmin:securepassword123@postgres:5432/arustore
      - REDIS_URL=redis://:redispassword123@redis:6379/0
      - ELASTICSEARCH_URL=http://elasticsearch:9200
      - CELERY_BROKER_URL=amqp://aruuser:arupassword123@rabbitmq:5672//
      - CELERY_RESULT_BACKEND=redis://:redispassword123@redis:6379/1
    depends_on:
      - rabbitmq
      - redis
      - postgres
    volumes:
      - ./backend:/app
      - /app/__pycache__
    command: celery -A app.core.celery_app worker --loglevel=info --concurrency=4
    networks:
      - arustore-network
    restart: unless-stopped

  celery-beat:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: arustore-celery-beat
    environment:
      - DATABASE_URL=postgresql://aruadmin:securepassword123@postgres:5432/arustore
      - REDIS_URL=redis://:redispassword123@redis:6379/0
      - CELERY_BROKER_URL=amqp://aruuser:arupassword123@rabbitmq:5672//
      - CELERY_RESULT_BACKEND=redis://:redispassword123@redis:6379/1
    depends_on:
      - rabbitmq
      - redis
    volumes:
      - ./backend:/app
    command: celery -A app.core.celery_app beat --loglevel=info
    networks:
      - arustore-network
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: arustore-frontend
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
    ports:
      - "3000:3000"
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    command: npm run dev
    networks:
      - arustore-network
    restart: unless-stopped

networks:
  arustore-network:
    driver: bridge
    name: arustore-network

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  es_data:
    driver: local
  minio_data:
    driver: local
  rabbitmq_data:
    driver: local
"@ | Out-File -FilePath "docker-compose.yml" -Encoding UTF8

Write-Host "docker-compose.yml created!" -ForegroundColor Green
Write-Host ""
Write-Host "Setup Complete!" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Make sure Docker Desktop is running"
Write-Host "2. Run: docker-compose up -d"
Write-Host "3. Wait for all containers to start (about 2-3 minutes)"
Write-Host "4. Access:"
Write-Host "   - Frontend: http://localhost:3000"
Write-Host "   - Backend API: http://localhost:8000/docs"
Write-Host "   - MinIO Console: http://localhost:9001 (minioadmin/minioadmin123)"
Write-Host "   - RabbitMQ Management: http://localhost:15672 (aruuser/arupassword123)"
Write-Host ""
Write-Host "Happy coding!" -ForegroundColor Green