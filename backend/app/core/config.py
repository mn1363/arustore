from typing import List, Literal, Optional
from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

INSECURE_SECRET_PLACEHOLDERS = frozenset(
    {
        "",
        "change-this-secret-key-in-production-env",
        "your-super-secret-key-change-this-in-production",
        "changeme",
        "secret",
        "default",
        "password",
    }
)


class Settings(BaseSettings):
    PROJECT_NAME: str = "AruStore API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    SECRET_KEY: str = Field(
        default="change-this-secret-key-in-production-env",
        repr=False,
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    REFRESH_COOKIE_NAME: str = "aru_refresh_token"
    REFRESH_COOKIE_SECURE: Optional[bool] = None
    REFRESH_COOKIE_SAMESITE: Literal["lax", "strict", "none"] = "lax"

    # Defaults to local async SQLite for zero-config dev/CI; override with PostgreSQL in Docker/production
    DATABASE_URL: str = "sqlite+aiosqlite:///./arustore.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    ELASTICSEARCH_URL: str = "http://localhost:9200"

    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = Field(default="minioadmin123", repr=False)
    MINIO_BUCKET: str = "arustore"

    CELERY_BROKER_URL: str = "memory://"
    CELERY_RESULT_BACKEND: str = "cache+memory://"
    CELERY_TASK_ALWAYS_EAGER: bool = True

    PAYMENT_GATEWAY_KEY: str = "sandbox_key"
    PAYMENT_GATEWAY_SECRET: str = Field(default="sandbox_secret", repr=False)

    # None resolves to False in production and True in development/test.
    # Explicitly enabling AUTO_SEED_DEMO_DATA=True in production fails startup.
    AUTO_SEED_DEMO_DATA: Optional[bool] = None

    ALLOWED_HOSTS: List[str] = [
        "localhost",
        "127.0.0.1",
        "0.0.0.0",
        "testserver",
    ]
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ]
    CORS_ORIGIN_REGEX: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )

    @property
    def is_production(self) -> bool:
        return (self.ENVIRONMENT or "").strip().lower() == "production"

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        if self.is_production:
            raw_secret = (self.SECRET_KEY or "").strip()
            if (
                not raw_secret
                or raw_secret.lower() in INSECURE_SECRET_PLACEHOLDERS
                or len(raw_secret) < 32
            ):
                raise ValueError(
                    "Invalid production configuration: SECRET_KEY must be explicitly "
                    "configured with a strong non-placeholder value (at least 32 characters)."
                )

            if self.AUTO_SEED_DEMO_DATA is True:
                raise ValueError(
                    "Invalid production configuration: AUTO_SEED_DEMO_DATA cannot be "
                    "enabled when ENVIRONMENT=production."
                )
            self.AUTO_SEED_DEMO_DATA = False

            cleaned_hosts = [h.strip() for h in self.ALLOWED_HOSTS if h and h.strip()]
            if not cleaned_hosts or "*" in cleaned_hosts:
                raise ValueError(
                    "Invalid production configuration: ALLOWED_HOSTS must list explicit "
                    "hostnames and cannot contain '*'."
                )
            self.ALLOWED_HOSTS = cleaned_hosts

            cleaned_origins = [o.strip() for o in self.CORS_ORIGINS if o and o.strip()]
            if "*" in cleaned_origins:
                raise ValueError(
                    "Invalid production configuration: CORS_ORIGINS cannot contain '*' "
                    "when credentials are enabled."
                )
            self.CORS_ORIGINS = cleaned_origins

            if self.CORS_ORIGIN_REGEX and (
                "*" in self.CORS_ORIGIN_REGEX
                or "e2b.app" in self.CORS_ORIGIN_REGEX.lower()
            ):
                raise ValueError(
                    "Invalid production configuration: broad wildcard or sandbox "
                    "CORS_ORIGIN_REGEX patterns are not permitted in production."
                )

            if self.REFRESH_COOKIE_SECURE is None:
                self.REFRESH_COOKIE_SECURE = True
        else:
            if self.AUTO_SEED_DEMO_DATA is None:
                self.AUTO_SEED_DEMO_DATA = True
            if self.REFRESH_COOKIE_SECURE is None:
                self.REFRESH_COOKIE_SECURE = False

        return self


settings = Settings()
