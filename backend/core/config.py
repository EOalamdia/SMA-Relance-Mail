"""Configuration for SMA."""
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = Field(..., env="APP_NAME")
    app_slug: str = Field(..., env="APP_SLUG")
    app_schema: str = Field(..., env="APP_SCHEMA")

    supabase_url: str = Field(..., env="SUPABASE_URL")
    supabase_anon_key: str = Field(..., env="SUPABASE_ANON_KEY")
    supabase_service_role_key: str = Field(default="", env="SUPABASE_SERVICE_ROLE_KEY")

    api_host: str = Field(default="0.0.0.0", env="API_HOST")
    api_port: int = Field(default=8000, env="API_PORT")
    api_debug: bool = Field(default=False, env="API_DEBUG")
    api_reload: bool = Field(default=False, env="API_RELOAD")

    cors_origins: str = Field(default="https://192.168.15.157", env="CORS_ORIGINS")

    domain_frontend: str = Field(default="192.168.15.157", env="DOMAIN_FRONTEND")
    domain_api: str = Field(default="192.168.15.157", env="DOMAIN_API")
    domain_base: str = Field(default="192.168.15.157", env="DOMAIN_BASE")
    frontend_base_path: str = Field(..., env="FRONTEND_BASE_PATH")

    redis_url: str = Field(default="redis://redis:6379", env="REDIS_URL")
    redis_host: str = Field(default="redis", env="REDIS_HOST")
    redis_port: int = Field(default=6379, env="REDIS_PORT")
    redis_db: int = Field(default=0, env="REDIS_DB")
    redis_password: str = Field(default="", env="REDIS_PASSWORD")

    session_max_age: int = Field(default=7200, env="SESSION_MAX_AGE")
    session_cookie_name: str = Field(..., env="SESSION_COOKIE_NAME")
    session_cookie_domain: str = Field(default="", env="SESSION_COOKIE_DOMAIN")
    session_cookie_secure: bool = Field(default=True, env="SESSION_COOKIE_SECURE")
    session_cookie_samesite: str = Field(default="lax", env="SESSION_COOKIE_SAMESITE")

    rate_limit_max_requests: int = Field(default=100, env="RATE_LIMIT_MAX_REQUESTS")
    rate_limit_window_seconds: int = Field(default=60, env="RATE_LIMIT_WINDOW_SECONDS")
    rate_limit_dev_max_requests: int = Field(default=1000, env="RATE_LIMIT_DEV_MAX_REQUESTS")

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def session_cookie_domain_or_none(self) -> str | None:
        domain = self.session_cookie_domain.strip()
        return domain or None

    @property
    def is_production(self) -> bool:
        return not bool(self.api_debug)

    @property
    def public_scheme(self) -> str:
        return "https" if self.session_cookie_secure else "http"

    @property
    def api_url(self) -> str:
        return f"{self.public_scheme}://{self.domain_api}"

    def enforce_security_baseline(self) -> None:
        if not self.is_production:
            return

        issues: list[str] = []

        if not self.session_cookie_secure:
            issues.append("SESSION_COOKIE_SECURE doit etre true en production")

        if self.session_cookie_samesite.lower() not in ["strict", "lax"]:
            issues.append("SESSION_COOKIE_SAMESITE doit etre strict ou lax en production")

        if not self.session_cookie_domain:
            issues.append("SESSION_COOKIE_DOMAIN doit etre renseigne en production")

        if "*" in self.cors_origins or "http://localhost" in self.cors_origins:
            issues.append("CORS_ORIGINS ne doit pas contenir * ou localhost en production")

        if not all(origin.startswith("https://") for origin in self.cors_origins_list):
            issues.append("CORS_ORIGINS doit utiliser https en production")

        if "__" in self.app_slug or "__" in self.frontend_base_path:
            issues.append("APP_SLUG et FRONTEND_BASE_PATH doivent etre personnalises (pas de placeholder)")

        if issues:
            raise ValueError("Configuration securite invalide: " + "; ".join(issues))


@lru_cache()
def get_settings() -> Settings:
    config = Settings()
    config.enforce_security_baseline()
    return config


settings = get_settings()
