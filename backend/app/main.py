import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.db import Base, engine, SessionLocal
from database.seed import seed_database
from backend.app.config import settings
from backend.app.models.schema import Student
from backend.app.routers import subjects, concepts, assessments, recommendations, notes


def _init_database_sync():
    """Initializes schema and seeds demonstration data in a background thread."""
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            has_student = db.query(Student).first()
            if not has_student:
                print("Seeding database on initial application startup...")
                seed_database()
        finally:
            db.close()
    except Exception as e:
        print(f"Database initialization warning (deferred/skipped): {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Non-blocking lifespan manager.
    Runs database schema verification in a background worker thread
    so Uvicorn immediately binds to $PORT without blocking on Render/Neon cold starts.
    """
    asyncio.create_task(asyncio.to_thread(_init_database_sync))
    yield


app = FastAPI(
    title="Adaptive Learning Platform API",
    description="Prototype API for concept-based adaptive learning, secure assessments, and rule-based pedagogical recommendations.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for frontend access (supporting localhost, custom domains, and Vercel deployments)
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
def root_info():
    return {
        "status": "healthy",
        "app": "Adaptive Learning Platform Prototype",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "ai_provider": settings.AI_PROVIDER
    }


@app.get("/health")
def health_check():
    """Lightweight health check endpoint for Render liveness probes."""
    return {"status": "ok"}
