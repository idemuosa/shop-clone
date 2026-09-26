from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Ensure postgresql+psycopg2 driver scheme is used for PostgreSQL connections
default_db_url = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/vivi_shop")
if default_db_url.startswith("postgres://"):
    default_db_url = default_db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif default_db_url.startswith("postgresql://") and not default_db_url.startswith("postgresql+"):
    default_db_url = default_db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

SQLALCHEMY_DATABASE_URL = default_db_url

connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
