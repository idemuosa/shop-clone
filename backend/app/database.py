from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import re
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./shop.db")

def create_db_engine(db_url: str):
    connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

    # Handle postgres URL schemes
    is_postgres = db_url.startswith("postgres://") or db_url.startswith("postgresql://") or "postgresql+" in db_url

    if is_postgres:
        # Standardize prefix to postgresql://
        clean_url = db_url
        if clean_url.startswith("postgres://"):
            clean_url = clean_url.replace("postgres://", "postgresql://", 1)

        # Remove driver specification if present to test driver variants
        base_pg_url = re.sub(r"^postgresql\+[a-zA-Z0-9_]+://", "postgresql://", clean_url)

        # Driver options to try in order of preference
        driver_urls = [
            base_pg_url.replace("postgresql://", "postgresql+psycopg2://", 1),
            base_pg_url.replace("postgresql://", "postgresql+psycopg://", 1),
            base_pg_url
        ]

        last_exception = None
        for test_url in driver_urls:
            try:
                test_engine = create_engine(test_url, connect_args=connect_args)
                with test_engine.connect() as conn:
                    print(f"Successfully connected to PostgreSQL database using URL format: {test_url.split('@')[-1] if '@' in test_url else 'configured DB'}")
                    return test_engine
            except Exception as e:
                last_exception = e
                continue

        print(f"[DATABASE WARNING] PostgreSQL connection failed: {last_exception}")
        print("[DATABASE WARNING] Falling back to local SQLite database (sqlite:///./shop.db).")
        if "psycopg2" in str(last_exception) or "No module named" in str(last_exception):
            print("[DATABASE HINT] If using PostgreSQL, ensure psycopg2-binary is installed (pip install psycopg2-binary).")

    # SQLite fallback or standard creation
    fallback_url = "sqlite:///./shop.db" if is_postgres else db_url
    fallback_connect_args = {"check_same_thread": False} if fallback_url.startswith("sqlite") else {}
    return create_engine(fallback_url, connect_args=fallback_connect_args)

engine = create_db_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
