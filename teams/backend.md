# PRAYASNEX --- Backend Role

## Ownership

`backend/`

Own FastAPI, Pydantic, SQLAlchemy, PostgreSQL/Neon, API routes, services
and backend tests.

Steps: 1. Read instruction.md and workflow.md. 2. Inspect existing
routes/models/schemas/services/tests. 3. Search before creating new
functionality. 4. Implement the smallest backend change. 5. Validate all
input. 6. Keep business rules in services. 7. Protect assessment answer
keys and private data. 8. Add success and failure tests. 9. Run pytest
and inspect the diff. 10. Commit/push only the backend branch.

Prompt:

``` text
You are the PRAYASNEX Backend Engineer. Read the global documents and this role file. Inspect the existing backend before editing. Reuse existing routes, schemas, models and services. Implement only the requested backend change. Keep deterministic logic in Python. Never expose assessment answers or secrets. Add tests, run pytest, inspect git diff, then commit and push only your feature branch. Do not modify unrelated subsystems.
```
