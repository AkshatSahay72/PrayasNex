import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./adaptive_learning.db").strip()

# Neon / Render normalization: postgres:// -> postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine_kwargs = {}

if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # PostgreSQL / Neon configuration
    engine_kwargs["connect_args"] = {"connect_timeout": 10}
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10

engine = create_engine(
    DATABASE_URL,
    echo=False,
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency providing database session to FastAPI endpoints."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def migrate_schema():
    """Widens column types in existing PostgreSQL databases if needed."""
    if not DATABASE_URL.startswith("sqlite"):
        from sqlalchemy import text
        alters = [
            "ALTER TABLE students ALTER COLUMN id TYPE VARCHAR(128);",
            "ALTER TABLE subjects ALTER COLUMN id TYPE VARCHAR(128);",
            "ALTER TABLE subjects ALTER COLUMN name TYPE VARCHAR(256);",
            "ALTER TABLE topics ALTER COLUMN id TYPE VARCHAR(256);",
            "ALTER TABLE topics ALTER COLUMN subject_id TYPE VARCHAR(128);",
            "ALTER TABLE topics ALTER COLUMN name TYPE VARCHAR(256);",
            "ALTER TABLE concepts ALTER COLUMN id TYPE VARCHAR(256);",
            "ALTER TABLE concepts ALTER COLUMN topic_id TYPE VARCHAR(256);",
            "ALTER TABLE concepts ALTER COLUMN name TYPE VARCHAR(256);",
            "ALTER TABLE concepts ALTER COLUMN prerequisite_concept_id TYPE VARCHAR(256);",
            "ALTER TABLE questions ALTER COLUMN id TYPE VARCHAR(128);",
            "ALTER TABLE questions ALTER COLUMN concept_id TYPE VARCHAR(256);",
            "ALTER TABLE attempts ALTER COLUMN id TYPE VARCHAR(128);",
            "ALTER TABLE attempts ALTER COLUMN student_id TYPE VARCHAR(128);",
            "ALTER TABLE attempts ALTER COLUMN question_id TYPE VARCHAR(128);",
            "ALTER TABLE attempts ALTER COLUMN concept_id TYPE VARCHAR(256);",
            "ALTER TABLE student_concept_progress ALTER COLUMN id TYPE VARCHAR(512);",
            "ALTER TABLE student_concept_progress ALTER COLUMN student_id TYPE VARCHAR(128);",
            "ALTER TABLE student_concept_progress ALTER COLUMN concept_id TYPE VARCHAR(256);",
            "ALTER TABLE notes ALTER COLUMN id TYPE VARCHAR(512);",
            "ALTER TABLE notes ALTER COLUMN concept_id TYPE VARCHAR(256);",
            "ALTER TABLE notes ALTER COLUMN title TYPE VARCHAR(256);",
            "UPDATE student_concept_progress SET mastery_score = mastery_score / 100.0 WHERE mastery_score > 1.0;"
        ]
        with engine.begin() as conn:
            for sql in alters:
                try:
                    conn.execute(text(sql))
                except Exception:
                    pass

