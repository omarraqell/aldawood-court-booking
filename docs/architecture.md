# Architecture Overview

## Services

- `api`: system of record for booking logic and database access
- `agent`: LangGraph orchestration service that wraps backend endpoints as tools
- `admin-web`: admin dashboard and internal test console

## Key principles

- Keep booking business logic in the backend.
- Keep the agent focused on orchestration and dialogue state.
- Persist conversations for debugging and future channel integrations.
- Enforce booking conflicts at the database layer.

