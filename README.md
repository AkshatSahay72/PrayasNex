# PrayasNex — Adaptive Learning Platform

PrayasNex is a concept-level adaptive learning platform prototype. It evaluates student performance, identifies knowledge gaps, reasons over prerequisite dependencies, and provides targeted recommendations and review notes.

---

## Architecture & Production Deployment Stack

- **Backend**: FastAPI + Pydantic v2 + SQLAlchemy (Ready for **Render**)
- **Database**: PostgreSQL (Ready for **Neon Serverless Postgres**) or SQLite locally
- **Frontend**: React 19 + TypeScript + Tailwind CSS (Ready for **Vercel**)
- **LLM Engine**: Groq API (`llama-3.3-70b-versatile` / `llama-3.1-8b-instant`) with ExamBuddy quality validation

---

## 1. Cloud Deployment Guide

### A. Neon Postgres Setup (Database)
1. Create a free PostgreSQL database at [neon.tech](https://neon.tech).
2. Copy your connection string:
   ```
   postgresql://<user>:<password>@<ep-pooler-id>.neon.tech/neondb?sslmode=require
   ```
3. Set `DATABASE_URL` in your backend environment variables. The application automatically initializes tables and seed data upon initial startup.

---

### B. Render Setup (Backend API)
The repository includes a ready-to-use [`render.yaml`](./render.yaml) blueprint.

1. Go to [dashboard.render.com](https://dashboard.render.com) and click **New +** → **Web Service** (or **Blueprint**).
2. Connect your Git repository.
3. Configure the service settings:
   - **Environment**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   - `DATABASE_URL`: Your Neon Postgres connection string.
   - `GROQ_API_KEY`: Your Groq API key.
   - `GROQ_MODEL`: `llama-3.3-70b-versatile`
   - `AI_PROVIDER`: `groq`
   - `ENVIRONMENT`: `production`
   - `CORS_ORIGINS`: `*` (or your Vercel URL)
5. Deploy. Your backend API will be live at `https://<your-service-name>.onrender.com`.

---

### C. Vercel Setup (Frontend)
The frontend includes [`vercel.json`](./frontend/vercel.json) for single-page client routing.

1. Go to [vercel.com](https://vercel.com) and click **Add New** → **Project**.
2. Import your Git repository.
3. Set **Root Directory** to `frontend`.
4. Add Environment Variable:
   - `VITE_API_URL`: `https://<your-service-name>.onrender.com`
5. Deploy. Vercel will build and serve your app globally.

---

## 2. Local Development Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend (FastAPI + SQLite / Postgres)
```bash
# 1. Activate virtual environment
.\venv\Scripts\activate      # Windows
# source venv/bin/activate   # Linux/macOS

# 2. Install dependencies
pip install -r requirements.txt

# 3. Seed database
python -m database.seed

# 4. Start backend
uvicorn backend.app.main:app --reload --port 8000
```
Backend API docs: `http://127.0.0.1:8000/docs`

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 3. Automated Testing
Run the backend test suite:
```bash
pytest
```
All 23 unit, integration, and ExamBuddy quality tests run in under 2 seconds.
