# PrayasNex — Adaptive Learning Platform

PrayasNex is a concept-level adaptive learning platform prototype. It evaluates student performance, identifies knowledge gaps, reasons over prerequisite dependencies, and provides targeted recommendations and review notes.

---

## 1. Simple Cloud Deployment Guide

### A. Neon Postgres Setup (Database)
Your database is already initialized on Neon:
```
postgresql://neondb_owner:npg_KvB0meoVRX4c@ep-polished-waterfall-b4gh807v-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

---

### B. Render Setup (Simple Web Service Hosting)
In [dashboard.render.com](https://dashboard.render.com):

1. Click **New +** → **Web Service**.
2. Choose **Build and deploy from a Git repository** and connect your repo.
3. Fill in the simple form:
   - **Name**: `prayasnex-backend`
   - **Region**: `Oregon (US West)` or closest to your database
   - **Branch**: `master` (or `main`)
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`
4. Under **Advanced** → **Environment Variables**, add these:
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | `postgresql://neondb_owner:npg_KvB0meoVRX4c@ep-polished-waterfall-b4gh807v-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |
   | `GROQ_API_KEY` | `your_groq_api_key` |
   | `GROQ_MODEL` | `qwen/qwen3.8-27b` (or `llama-3.3-70b-versatile`) |
   | `AI_PROVIDER` | `groq` |
   | `ENVIRONMENT` | `production` |
   | `CORS_ORIGINS` | `*` |
5. Under **Advanced** → **Health Check Path**, enter: `/health`
6. Click **Create Web Service**.

Your backend will be deployed at `https://<your-service-name>.onrender.com`.

---

### C. Vercel Setup (Frontend)
In [vercel.com](https://vercel.com):

1. Click **Add New** → **Project**.
2. Import your Git repository.
3. In **Root Directory**, select `frontend`.
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://<your-service-name>.onrender.com`
5. Click **Deploy**.

---

## 2. Local Development

### Backend (FastAPI)
```bash
.\venv\Scripts\activate
uvicorn backend.app.main:app --reload --port 8000
```
API Docs: `http://127.0.0.1:8000/docs`

### Frontend (React + Vite)
```bash
cd frontend
npm run dev
```
Open `http://localhost:5173`

---

## 3. Automated Tests
```bash
pytest
```
