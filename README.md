# PrayasNex — Adaptive Learning Platform (Prototype)

This is the working prototype of the **Adaptive Learning Platform**. It implements a complete, closed-loop adaptive learning system at the granular **concept level**.

---

## 1. Core Learning Loop

```
Student
  ↓
Subject / Topic (Machine Learning → Optimization)
  ↓
Concept (Gradient, Learning Rate, Gradient Descent)
  ↓
Concept Learning Note (Markdown + LaTeX Formulas)
  ↓
Concept-Based MCQ Test (5 Questions)
  ↓
Answer Submission (Secure: No answers exposed to frontend)
  ↓
Backend Evaluation & Attempt Storage (SQLite)
  ↓
Concept Performance & Mastery Update
  ↓
Weak Concept Detection (<50% Weak, 50-79% Practice, ≥80% Strong)
  ↓
Personalized Note / Prerequisite Intervention
  ↓
Adaptive Recommendation
```

---

## 2. Architecture & Stack

- **Backend**: Python 3.13+, FastAPI, Pydantic v2, SQLAlchemy, Uvicorn
- **Database**: SQLite (`adaptive_learning.db`)
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, React Markdown
- **Testing**: pytest (18 unit and integration tests)
- **AI Service & Validation**: Isolated LLM interface with fallback and **ExamBuddy Quality Inspector** (guards against option length bias, invalid schemas, duplicate options, and lazy distractors like "All of the above").

---

## 3. Quickstart Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### A. Backend Setup & Startup

1. **Create and Activate Virtual Environment**:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```

2. **Install Python Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Initialize & Seed the SQLite Database**:
   ```bash
   python -m database.seed
   ```

4. **Start the FastAPI Backend Server**:
   ```bash
   uvicorn backend.app.main:app --reload --port 8000
   ```
   The API will be live at `http://127.0.0.1:8000` with Swagger docs at `http://127.0.0.1:8000/docs`.

---

### B. Frontend Setup & Startup

1. **Install Node Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Run Vite Development Server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

---

## 4. Running Backend Tests

Run all unit, integration, and ExamBuddy quality tests:
```bash
pytest
```

---

## 5. Walkthrough Demonstration Scenario

1. **Open the App**: Navigate to `http://localhost:5173` (Alex Rivera demo student is preloaded).
2. **Review Dashboard**: Notice the initial mastery and the deterministic recommendation hero banner.
3. **Study a Concept**: Click **"Read Learning Note"** on *Gradient Descent Algorithm* to view the markdown guide.
4. **Take Assessment Test**: Click **"Take Concept Test"** and answer the 5 questions.
   - *Security Check*: Inspect the browser network tab. Notice that `GET /api/assessments/questions` never transmits `correct_option` or `explanation`.
5. **Submit Answers & Observe Weak Concept Detection**:
   - If you score $< 50\%$ (e.g. 2/5 correct), the system classifies performance as **Weak** and checks prerequisite dependencies.
   - If the prerequisite *Learning Rate* or *Gradient* is weak, it prompts: *"Review Foundation: Learning Rate first"*.
   - If prerequisite is strong, it prompts: *"Focus Review: Gradient Descent Note"*.
6. **Retake & Achieve Mastery**:
   - Answer all 5 questions correctly (5/5 = 100%).
   - The status transitions to **Mastered** ($\ge 80\%$) and the recommendation automatically prompts: *"Mastery Achieved! Advance to next topic"*.
7. **Inspect AI Service & ExamBuddy Rules**:
   - Open the **"AI & Quality Inspector"** tab to test how the validator catches lazy distractors, option length cluing, and schema failures in real time.
