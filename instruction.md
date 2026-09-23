# PRAYASNEX --- Global Instructions

## Purpose

PRAYASNEX is an AI-assisted adaptive learning platform. Its core idea
is: **the course remains the same, but the learning experience becomes
different for every student.**

## Current Stack

-   Frontend: React 18, TypeScript, TailwindCSS, Lucide, KaTeX,
    Markdown, Axios
-   Backend: FastAPI, SQLAlchemy, Pydantic v2
-   Database: PostgreSQL on Neon
-   LLM: Groq API
-   Frontend hosting: Vercel
-   Backend hosting: Render

Do not replace this architecture unless explicitly requested.

## Architecture

``` text
React Frontend
      ↓ REST/JSON
FastAPI Backend
      ↓
Deterministic Adaptive Engine + Question Validator
      ↓
AI Service → Groq API
      ↓
PostgreSQL / Neon
```

Groq is backend-only. Never expose `GROQ_API_KEY` to the browser.

## Core Learning Loop

``` text
Understand Student
→ Identify Knowledge Gaps
→ Personalize Learning
→ Learn
→ Practice
→ Evaluate
→ Update Evidence
→ Adapt Next Activity
```

## Curriculum

Use:

``` text
Subject → Topic → Concept → Prerequisites → Notes / Questions
```

Keep concept IDs stable, e.g. `ml.optimization.gradient_descent`.

## AI Rules

Use Groq for generation tasks such as curriculum content, MCQs,
personalized notes and focus-mode explanations. Do not use the LLM for
deterministic score calculation, mastery thresholds, prerequisite
traversal or basic adaptive routing.

Treat every LLM response as untrusted until validated.

## MCQ Contract

Validate: 1. Exactly 4 options A/B/C/D. 2. Exactly one correct option.
3. Distinct options. 4. No all-of-the-above / none-of-the-above /
both-A-and-B shortcuts. 5. Meaningful explanation. 6. Concept alignment.
7. Appropriate difficulty. 8. Relevant distractors. 9. Reasonable
option-length symmetry.

Keep regression tests for the known ExamBuddy failures: oversized
correct option, irrelevant distractors, absurd distractors, multiple
defensible answers, ambiguity and topic mismatch.

## Adaptive Rules

Current deterministic thresholds: - `<50%` → Weak / Needs Immediate
Care - `50–79%` → Needs Practice - `≥80%` → Mastered

Routing: - weak + weak prerequisite → prerequisite review - weak + no
prerequisite gap → current note + practice - needs practice → targeted
reinforcement - mastered → next/higher-order concept or module
completion

## Assessment Security

The active frontend must never receive the correct answer. Evaluation
happens on the backend. Never expose API keys, internal prompts or
private student data.

## UI

Use a calm academic dark aesthetic. Avoid generic AI-SaaS patterns:
excessive gradients, neon effects, glassmorphism, huge hero sections,
card spam, random AI imagery and unnecessary animation. Prioritize
readability and learning flow.

## Current Verification

The current implementation reports 26/26 backend pytest tests passing
and a successful frontend TypeScript/Vite build. Preserve these quality
gates.

## General Antigravity Prompt

``` text
You are working on PRAYASNEX.

Read instruction.md, workflow.md, then your assigned team role document before coding.

First inspect the existing repository. Search for existing routes, models, services, components and tests before creating anything.

Make a short plan, then make the smallest complete change required.

Preserve existing architecture and contracts. Do not invent unnecessary dependencies or duplicate working functionality.

Keep deterministic learning decisions in code. Treat Groq output as untrusted and validate it. Never expose Groq credentials or assessment answers.

After implementation:
1. run relevant tests
2. run type/build checks
3. inspect git diff
4. check for secrets
5. report changed files, tests, branch, commit and limitations
6. commit only validated work on the correct feature branch

Never force-push, hard-reset shared work or directly modify main.
```
