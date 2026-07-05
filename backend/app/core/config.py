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
