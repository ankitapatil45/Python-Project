import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URI", "sqlite:///ticket_system.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT settings
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-supersecretkey")  # Separate JWT secret key (optional)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=60)   # Access token expiry time
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)     # Refresh token expiry time

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False
    # You might want to override DB URI and JWT_SECRET_KEY in production env variables

config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig
}
