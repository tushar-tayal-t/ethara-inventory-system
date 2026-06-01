from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# For SQLite, we must set check_same_thread to False for FastAPI multi-threading
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Setup database engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args
)

# Setup local database session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative Base for all DB models
Base = declarative_base()
