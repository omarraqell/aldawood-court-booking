# Aldawood Court Booking

Full-stack court booking platform with an AI-powered conversational agent, NestJS backend, and Next.js admin dashboard.

## Architecture

| Service | Tech | Port |
|---------|------|------|
| **Database** | PostgreSQL 16 | 5432 |
| **API** | NestJS + Prisma | 4000 |
| **Agent** | FastAPI + LangGraph (GPT-5 mini) | 8000 |
| **Admin Dashboard** | Next.js 15 + React 18 | 3000 |

```
apps/
  api/          # NestJS backend — bookings, courts, policies, auth
  agent/        # Python AI agent — ReAct loop with LangGraph
  admin-web/    # Next.js admin dashboard
```

## Quick Start (Docker)

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- An [OpenAI API key](https://platform.openai.com/api-keys)

### 1. Clone and configure

```bash
git clone https://github.com/YOUR_USERNAME/aldawood-court-booking.git
cd aldawood-court-booking
cp .env.example .env
```

Open `.env` and set your `OPENAI_API_KEY`:

```
OPENAI_API_KEY=sk-proj-your-key-here
```

### 2. Run everything

```bash
docker compose up --build
```

This starts all 4 services. The API automatically runs database migrations and seeds initial data on first boot.

### 3. Open the dashboard

- **Admin Dashboard**: http://localhost:3000
- **API**: http://localhost:4000/api
- **Agent**: http://localhost:8000

### Login credentials

| Field | Value |
|-------|-------|
| Email | `owner@aldawood.local` |
| Password | `ChangeMe123!` |

(Configurable via `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`)

## Local Development (without Docker)

If you prefer running services directly:

### Prerequisites

- Node.js 20+
- Python 3.11+
- PostgreSQL 16 running on port 5432

### Setup

```bash
# Install JS dependencies
npm install

# Set up the database
cp .env.example .env
# Edit .env with your settings
cd apps/api
npx prisma migrate dev
npx ts-node prisma/seed.ts
cd ../..

# Install Python dependencies
cd apps/agent
pip install -r requirements.txt
cd ../..
```

### Run services

```bash
# Terminal 1 — API
npm run dev:api

# Terminal 2 — Agent
npm run dev:agent

# Terminal 3 — Admin Dashboard
npm run dev:admin
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | — | OpenAI API key for the AI agent |
| `OPENAI_MODEL` | No | `gpt-5-mini` | OpenAI model to use |
| `DATABASE_URL` | No | `postgresql://postgres:postgres@localhost:5432/aldawood_booking` | PostgreSQL connection string |
| `JWT_SECRET` | No | `replace_me` | Secret for admin JWT tokens |
| `ADMIN_EMAIL` | No | `owner@aldawood.local` | Seeded admin email |
| `ADMIN_PASSWORD` | No | `ChangeMe123!` | Seeded admin password |
| `API_PORT` | No | `4000` | Backend API port |

## AI Agent

The agent is a fully autonomous ReAct agent built with LangGraph and GPT-5 mini. It handles:

- Court availability checks
- Booking creation, modification, and cancellation
- Package inquiries and event bookings
- Natural conversation in English and Arabic (Jordanian dialect)

All agent actions are backed by real API calls to the backend — bookings go directly into the database.
