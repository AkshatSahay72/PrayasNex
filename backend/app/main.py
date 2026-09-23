from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.db import Base, engine, SessionLocal
from database.seed import seed_database
from backend.app.config import settings
from backend.app.models.schema import Student
from backend.app.routers import subjects, concepts, assessments, recommendations, notes


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes tables and seeds database if empty on startup."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if database has been seeded
        has_student = db.query(Student).first()
        if not has_student:
            print("Seeding database on initial application startup...")
            seed_database()
    finally:
        db.close()
    yield


app = FastAPI(
    title="Adaptive Learning Platform API",
    description="Prototype API for concept-based adaptive learning, secure assessments, and rule-based pedagogical recommendations.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for frontend access (supporting localhost and Vercel domains)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.ENVIRONMENT == "development" or "*" in settings.cors_origins_list else settings.cors_origins_list,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(subjects.router)
app.include_router(concepts.router)
app.include_router(assessments.router)
app.include_router(recommendations.router)
app.include_router(notes.router)


@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "app": "Adaptive Learning Platform Prototype",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "ai_provider": settings.AI_PROVIDER
    }
