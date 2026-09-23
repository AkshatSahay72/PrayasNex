# Adaptive Learning Platform --- Prototype Workflow

## 1. Purpose

This workflow defines exactly how the prototype should be developed.

The project should be developed as **one small complete system**, not as
six independent pieces that only work at the end.

The main objective is to reach a working vertical slice quickly:

``` text
Frontend
   ↓
Backend
   ↓
Database
   ↓
Assessment
   ↓
Student Evidence
   ↓
Adaptive Recommendation
   ↓
Frontend
```

AI is an enhancement inside this loop, not a dependency that blocks the
entire system.

------------------------------------------------------------------------

# 2. Before Starting Any Work

Every developer or Antigravity agent must do this first:

### Step 1

Read:

``` text
instruction.md
```

### Step 2

Inspect the repository:

``` text
git status
```

Then inspect:

-   existing directories
-   existing package files
-   backend files
-   frontend files
-   database files
-   tests
-   environment configuration
-   README

### Step 3

Do not immediately start creating files.

First determine:

-   what already exists
-   what is missing
-   which feature is currently being implemented
-   whether another feature already provides part of the required
    behavior

### Step 4

Write a short implementation plan.

Example:

``` text
1. Add Concept model
2. Add Question model
3. Add endpoint for questions
4. Add test submission endpoint
5. Store attempts
6. Calculate concept score
7. Return recommendation
8. Connect frontend results page
```

Then implement.

------------------------------------------------------------------------

# 3. Development Order

Build the prototype in this order.

## Phase 1 --- Project Skeleton

Create the basic structure:

``` text
adaptive-learning/
├── frontend/
├── backend/
├── ai/
├── database/
├── tests/
├── scripts/
├── instruction.md
├── workflow.md
└── README.md
```

Make sure frontend and backend can start independently.

Do not implement advanced functionality yet.

------------------------------------------------------------------------

# 4. Phase 2 --- Database

Create the minimal SQLite data model.

Recommended:

``` text
students
subjects
topics
concepts
questions
attempts
student_concept_progress
notes
```

Seed a small amount of demonstration data.

For example:

``` text
Machine Learning
└── Optimization
    ├── Gradient
    ├── Learning Rate
    └── Gradient Descent
```

Create enough questions to run a complete demonstration.

Do not spend time creating hundreds of questions.

------------------------------------------------------------------------

# 5. Phase 3 --- Backend Foundation

Implement FastAPI.

Start with:

``` text
GET /subjects
GET /subjects/{id}/topics
GET /concepts/{id}
GET /questions
POST /attempts
GET /students/{id}/progress
GET /recommendations/{student_id}
GET /notes/{concept_id}
```

Only add endpoints when the UI actually requires them.

For every endpoint:

1.  define input
2.  validate input
3.  perform service operation
4.  return structured output
5.  test success
6.  test at least one failure case

------------------------------------------------------------------------

# 6. Phase 4 --- Assessment

Implement the first complete test flow before adding AI generation.

The backend should:

``` text
Select questions
    ↓
Send question WITHOUT answer
    ↓
Student submits selected options
    ↓
Backend evaluates
    ↓
Store attempts
    ↓
Calculate score
```

Never send:

``` text
correct_option
```

to the active test frontend.

------------------------------------------------------------------------

# 7. Phase 5 --- Student Progress

After an assessment:

``` text
attempts
   ↓
group by concept
   ↓
calculate performance
   ↓
update StudentConceptProgress
```

Prototype calculation can be simple.

Example:

``` text
5 attempts
4 correct
= 80%
```

Store enough information to explain why the recommendation was made.

------------------------------------------------------------------------

# 8. Phase 6 --- Adaptive Logic

Implement the simplest useful rule engine.

Example:

``` text
< 50%
    WEAK
    → review concept

50–79%
    NEEDS PRACTICE
    → practice again

80%+
    STRONG
    → move forward
```

If prerequisite information exists:

``` text
Weak Concept
    ↓
Check prerequisite
    ↓
Prerequisite weak?
    ├── yes → recommend prerequisite
    └── no → recommend current concept practice
```

Do not build a machine-learning recommender.

Do not call an LLM for these decisions.

------------------------------------------------------------------------

# 9. Phase 7 --- Personalized Notes

Start with static Markdown notes.

Example:

``` text
notes/
├── gradient.md
├── learning-rate.md
└── gradient-descent.md
```

Make sure the frontend can render them.

Only after that works should AI-generated notes be introduced.

AI-generated notes should have the same output shape as normal notes so
the frontend does not care whether a note was generated or static.

------------------------------------------------------------------------

# 10. Phase 8 --- AI Question Generation

Only add AI after the normal assessment system works.

Implement:

``` text
POST /questions/generate
```

The AI service should receive:

``` text
subject
topic
concept
difficulty
learning objective
optional source/context
```

Expected structured output:

``` json
{
  "question": "...",
  "options": [
    {"id": "A", "text": "..."},
    {"id": "B", "text": "..."},
    {"id": "C", "text": "..."},
    {"id": "D", "text": "..."}
  ],
  "correct_option": "B",
  "explanation": "...",
  "concept_id": "ml.optimization.gradient_descent",
  "difficulty": "medium"
}
```

Then validate it.

------------------------------------------------------------------------

# 11. AI Validation Workflow

Every generated question follows:

``` text
Generate
   ↓
Parse JSON
   ↓
Schema Validation
   ↓
Rule Validation
   ↓
Semantic/quality checks
   ↓
PASS ─────────→ Store
   │
   FAIL
   ↓
Retry / Reject
```

### Minimum validation

Check:

-   all required fields exist
-   exactly four options
-   option IDs are unique
-   correct option exists
-   no duplicate options
-   question is not empty
-   explanation exists
-   concept exists
-   difficulty is valid
-   options are not wildly unbalanced in length
-   distractors are relevant
-   no obviously unrelated answer
-   no multiple obvious correct answers

------------------------------------------------------------------------

# 12. Phase 9 --- Frontend

Build the UI around the working backend.

Implement in this order:

``` text
1. Dashboard
2. Subject/topic selection
3. Learning note
4. Test screen
5. Results screen
6. Recommendation screen
```

Do not build a large dashboard before the learning loop works.

------------------------------------------------------------------------

# 13. Phase 10 --- Connect the Complete Loop

Now test this exact scenario:

``` text
Open app
   ↓
Select Machine Learning
   ↓
Select Optimization
   ↓
Open Gradient Descent
   ↓
Read note
   ↓
Start test
   ↓
Answer 5 questions
   ↓
Submit
   ↓
Receive result
   ↓
Progress updates
   ↓
Weak concept detected
   ↓
Recommendation appears
   ↓
Student opens recommended note
```

If this works, the core prototype is working.

------------------------------------------------------------------------

# 14. Testing Workflow

Every meaningful feature should have tests.

## Backend

Test:

-   valid requests
-   invalid requests
-   database operations
-   answer evaluation
-   progress calculation
-   recommendation rules

## AI

Test:

-   valid output
-   malformed JSON
-   missing fields
-   invalid correct option
-   irrelevant distractor
-   oversized correct option
-   multiple correct answers

## Frontend

At minimum verify:

-   pages render
-   API data displays
-   answer submission works
-   results appear
-   recommendation appears
-   loading/error states work

------------------------------------------------------------------------

# 15. Manual Demo Test

Before showing the instructor, perform one clean manual run.

### Test student

Use one demonstration student.

### Test subject

``` text
Machine Learning
```

### Test topic

``` text
Optimization
```

### Test concept

``` text
Gradient Descent
```

### Test

Answer deliberately so the system produces a weak result.

Example:

``` text
2 / 5
```

Confirm:

``` text
Score = 40%
Status = Weak
Recommendation = Review concept
```

Then perform another attempt with a better result.

Confirm that the recommendation changes appropriately.

This proves that the system is actually adaptive.

------------------------------------------------------------------------

# 16. Git Workflow

Use a simple branch structure for the prototype.

``` text
main
│
├── feature/backend
├── feature/frontend
├── feature/ai
└── feature/qa
```

If the team is smaller, fewer branches are acceptable.

Rules:

-   do not work directly on main
-   do not force-push
-   do not hard-reset shared work
-   do not commit secrets
-   pull/rebase only when coordinated
-   inspect diff before commit
-   run tests before push

Use conventional commits:

``` text
feat: add concept assessment API
feat: add adaptive recommendation
fix: prevent answer leakage
test: add question validation tests
```

------------------------------------------------------------------------

# 17. When to Commit

Do not make one enormous commit.

Commit after a coherent unit works.

Good:

``` text
feat: add assessment models
feat: add assessment submission API
feat: add concept progress calculation
feat: add adaptive recommendation
feat: add test results UI
```

Avoid:

``` text
final-final-working-version
```

------------------------------------------------------------------------

# 18. AI Cost Control

During development:

-   use seeded questions first
-   avoid regenerating the same questions
-   cache AI responses when practical
-   use static notes while building UI
-   call the LLM only when testing the AI feature
-   do not use the LLM for deterministic logic

This keeps development cheap and predictable.

------------------------------------------------------------------------

# 19. What To Do If Something Breaks

Follow this order:

``` text
1. Read the error
2. Find the exact failing file
3. Reproduce the failure
4. Determine whether it is frontend, backend, database, AI or environment
5. Inspect existing code
6. Make the smallest fix
7. Run the previously failing test
8. Run related tests
9. Inspect diff
```

Do not immediately rewrite the whole feature.

------------------------------------------------------------------------

# 20. Cross-Team Changes

If one person needs another person's component:

Example:

``` text
Frontend needs:
GET /recommendations/{student_id}
```

Do not modify backend yourself.

Instead:

``` text
Frontend
   ↓
Document required response
   ↓
Backend implements contract
   ↓
Frontend integrates
```

Keep the interface explicit.

Example:

``` json
{
  "concept_id": "ml.optimization.gradient_descent",
  "status": "weak",
  "recommendation": "Review Gradient Descent",
  "reason": "Performance below the prototype threshold."
}
```

------------------------------------------------------------------------

# 21. Final Prototype Checklist

Before calling the prototype complete:

### Application

-   [ ] frontend starts
-   [ ] backend starts
-   [ ] SQLite initializes
-   [ ] seed data loads

### Learning

-   [ ] subject selection works
-   [ ] topic selection works
-   [ ] concept page works
-   [ ] notes display
-   [ ] test starts
-   [ ] questions display
-   [ ] answers submit
-   [ ] backend evaluates answers
-   [ ] attempts are stored

### Adaptation

-   [ ] concept score calculated
-   [ ] weak concept identified
-   [ ] recommendation generated
-   [ ] recommendation visible in UI
-   [ ] second attempt changes evidence

### AI

-   [ ] generated question has structured output
-   [ ] generated question is validated
-   [ ] invalid questions are rejected
-   [ ] AI failure does not crash the application

### Security

-   [ ] correct answers hidden during test
-   [ ] secrets not committed
-   [ ] backend validates requests

### Quality

-   [ ] tests pass
-   [ ] frontend build passes
-   [ ] no unnecessary infrastructure
-   [ ] README contains setup instructions
-   [ ] instructor demo can be completed from a clean start

------------------------------------------------------------------------

# 22. Prototype Completion Rule

Do not add another major feature merely because the prototype looks
small.

The prototype is successful when it proves:

> A student's performance on specific concepts can be recorded,
> analyzed, and used to change the next learning recommendation.

Everything else is secondary.

Once this vertical slice works reliably, the project can be expanded
toward the full production architecture without throwing away the
prototype.
