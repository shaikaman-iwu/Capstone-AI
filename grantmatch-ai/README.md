# GrantMatch AI

GrantMatch AI is a full-stack web application for small and mid-sized non-profits that need to find eligible grants faster, understand funder requirements in plain language, and generate a strong first-pass application draft without a dedicated grant-writing department.

## Overview

Small non-profits often have one overextended program director or executive director balancing service delivery, operations, volunteers, fundraising, and reporting. Grant discovery is usually manual, deadline-sensitive, and buried in long eligibility documents. GrantMatch AI compresses that process into a guided workflow:

- collect an organization profile once
- rank the most relevant grant opportunities by fit
- summarize dense eligibility language in plain English
- track urgency around deadlines
- generate a grounded first draft for an application narrative

## Business Case

### Company Context

The target customer is a small non-profit, typically with 1 to 15 staff members and an annual budget below $500,000. These organizations run community programs like youth mentorship, food access, environmental cleanup, and health outreach, but rarely have a dedicated grants team.

### Business Problem

Without a structured grant discovery workflow, teams routinely:

- miss deadlines
- spend weeks applying to poor-fit opportunities
- fall back on the same limited funding sources every year
- lose staff time that should go toward mission delivery

### Target Users

- Program directors who need fast, plain-language guidance
- Executive directors managing both operations and fundraising
- Volunteer or part-time grant writers who need a solid first draft quickly

### Why AI Fits

This is a retrieval, summarization, and drafting problem over messy, high-volume, unstructured data. A RAG-style system can ingest grant content, score it against organizational context, explain eligibility, and produce a first-pass draft grounded in mission and program facts instead of generic copy.

## Features

### Current MVP

- Authenticated user access with registration and local sign-in
- Organization profile intake with client and server validation
- AI-ranked grant recommendations based on mission, geography, budget, and program alignment
- Plain-language eligibility summaries
- Deadline urgency tracking
- AI-assisted narrative generation with OpenAI or Anthropic support and local fallback behavior
- Structured error handling and loading states across frontend and backend flows

### Data and Persistence

- User accounts stored in the relational database
- Session tokens stored in the database for protected API access
- Organization profile snapshots stored after ranking requests
- Narrative drafts saved in the backend data layer
- Saved top-match grant records persisted per user

## Technical Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: FastAPI, Pydantic, SQLAlchemy
- Database: SQLite for local development, PostgreSQL-ready for production deployment
- AI integration: OpenAI or Anthropic through a pluggable service layer
- Vector approach: local scoring fallback with Pinecone-ready configuration points
- Deployment: Docker, Nginx, GitHub Actions, Google Cloud Run

## Project Structure

```text
grantmatch-ai/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   └── services/
│   ├── .env.example
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── App.tsx
│   │   └── types.ts
│   ├── .env.example
│   ├── Dockerfile
│   └── nginx.conf
├── infra/
│   └── init.sql
├── .github/workflows/
├── .env.example
└── docker-compose.yml
```

## Environment Setup

### Backend

Copy [backend/.env.example](backend/.env.example) to `backend/.env`.

Important variables:

- `DATABASE_URL`: local SQLite by default, PostgreSQL in production
- `FRONTEND_ORIGIN`: allowed frontend origin for CORS
- `OPENAI_API_KEY`: enables OpenAI draft generation
- `ANTHROPIC_API_KEY`: enables Anthropic draft generation
- `AUTH_REQUIRED`: keeps API routes protected
- `DEMO_USER_PASSWORD`: password used for the seeded demo account

### Frontend

Copy [frontend/.env.example](frontend/.env.example) to `frontend/.env`.

Important variable:

- `VITE_API_BASE_URL`: backend API base URL, defaults to `http://localhost:8000`

## Local Development

### 1. Start the backend

```powershell
cd grantmatch-ai/backend
python -m venv .venv
. .venv/Scripts/Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`.

### 2. Start the frontend

```powershell
cd grantmatch-ai/frontend
npm install
copy .env.example .env
npm run dev
```

Frontend runs at `http://localhost:5173`.

### 3. Demo sign-in

Use this seeded local account after the backend starts:

- Email: `director@grantmatch.demo`
- Password: `grantmatch-demo`

### 4. Optional live AI setup

Add one of these to `backend/.env`:

- `OPENAI_API_KEY=...`
- `ANTHROPIC_API_KEY=...`

If neither is set, the app still works with deterministic fallback draft generation.

## Docker Development

Run the full stack with Docker Compose:

```bash
docker compose up --build
```

## Validation

Useful local checks:

```powershell
cd grantmatch-ai/backend
python -m compileall app

cd ../frontend
npm run build
```

## Deployment Notes

- The included GitHub Actions workflow is a starting point for Cloud Run deployment
- Cloud SQL should replace SQLite in production
- Secret Manager should store API keys and database credentials
- Pinecone can replace the local similarity fallback as the live grant corpus grows
