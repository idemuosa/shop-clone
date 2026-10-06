from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import re
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/shop")

def create_db_engine(db_url: str):
    if not db_url or "sqlite" in db_url.lower():
        raise ValueError("[DATABASE ERROR] SQLite is disabled for this project. Please configure a valid PostgreSQL connection string in DATABASE_URL environment variable.")

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
            test_engine = create_engine(test_url)
            with test_engine.connect() as conn:
                print(f"Successfully connected to PostgreSQL database using URL format: {test_url.split('@')[-1] if '@' in test_url else 'configured DB'}")
                return test_engine
        except Exception as e:
            last_exception = e
            continue

    raise RuntimeError(f"[DATABASE ERROR] Could not connect to PostgreSQL database ({last_exception}). Please check your PostgreSQL server connection and credentials in DATABASE_URL.")

engine = create_db_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
