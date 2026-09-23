# PRAYASNEX --- Development Workflow

## Startup

Every developer/agent must: 1. Read `instruction.md`. 2. Read
`workflow.md`. 3. Read their `team/<role>.md`. 4. Run `git status`. 5.
Inspect the repository and existing implementation. 6. Identify
ownership and dependencies. 7. Write a short implementation plan.

## Ownership

``` text
backend/                         → Backend
frontend/                        → Frontend
ai/                              → AI Question Engine
database/knowledge/              → Knowledge Graph
backend/app/services/adaptive/   → Adaptive Engine
.github/, tests/, scripts/       → DevOps/QA
```

Shared files require coordination.

## Development Sequence

``` text
Understand → Inspect → Plan → Implement → Test → Diff Review → Commit → Push
```

Never rewrite unrelated working code.

## AI Workflow

``` text
Request
→ Prompt
→ Groq
→ Parse
→ Schema validation
→ Deterministic validation
→ Quality validation
→ Accept OR reject/retry
```

Raw AI output must never go directly to the student.

## Assessment Workflow

``` text
Backend selects question
→ strip correct answer
→ frontend displays
→ student submits
→ backend evaluates
→ store attempt
→ update progress
→ adaptive recommendation
```

## Adaptive Workflow

``` text
Evidence → Concept Score → Mastery State → Prerequisite State → Recommendation
```

Do not call Groq for deterministic routing.

## Database Workflow

Inspect current schema first. Make compatible changes. Preserve student
history. Test both clean initialization and relevant existing-data
behavior.

## Frontend Workflow

Inspect components and API contracts first. Reuse existing patterns.
Implement loading, empty, error and success states. Do not put
authoritative business logic in React.

## Testing

Backend:

``` text
pytest
```

Frontend:

``` text
npm run build
```

Also run adaptive, assessment privacy and AI validator regression tests.

## Git

Recommended branches:

``` text
main
feature/backend
feature/frontend
feature/ai-question-engine
feature/knowledge-graph
feature/adaptive-engine
feature/devops-qa
```

Never force-push, hard-reset shared work, or auto-merge.

## Completion Report

Report:

``` text
Task
Implemented
Changed files
Tests
Build status
Branch
Commit
Known limitations
```
