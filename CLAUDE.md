# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test runner is configured yet.

## Stack

- **Next.js 16.2.1** — App Router only (no Pages Router). Read `node_modules/next/dist/docs/` before writing code; APIs differ significantly from older versions.
- **React 19.2.4**
- **Tailwind CSS v4** — configured via PostCSS (`postcss.config.mjs`), no `tailwind.config.*` file. Theme customization lives in `app/globals.css` using CSS variables.
- **TypeScript** — strict mode, path alias `@/*` maps to the repo root (`./`).
- **ESLint 9** — flat config in `eslint.config.mjs`.

## Architecture

App Router structure under `app/`:

- `app/layout.tsx` — root layout; loads Geist Sans + Geist Mono via `next/font/google`, sets CSS font variables, wraps body with `min-h-full flex flex-col`.
- `app/page.tsx` — home route (`/`).
- `app/globals.css` — Tailwind import + CSS variable theme (light/dark via `prefers-color-scheme`).

The project is a fresh scaffold — no data layer, API routes, or additional routes exist yet.


## code style preferences
use google convetion code

## Project
Act as a senior software architect specialized in Next.js applications.

I want to design a web application to manage a pig fattening farm. The application will initially be used by two users and should focus on cost tracking, production efficiency, and financial analysis.

Main objective:
Track pig batches, monitor feed consumption, record farm expenses, register weekly animal weight, and automatically calculate profitability.

The application must include:

1. A simple authentication system for two users.
2. Pig batch management including:
   - entry date
   - number of animals
   - birth weeks
   - initial weight
   - cost per animal
3. Weekly weight tracking per animal or per batch.
4. Feed consumption records including:
   - date
   - feed type
   - quantity in kg
   - cost per kg
5. Expense tracking for:
   - vaccines
   - dewormers
   - vitamins
   - other farm costs
6. Vaccination and deworming scheduling system.
7. Automatic calculations for:
   - total batch cost
   - cost per animal
   - cost per kilogram produced
8. Feed conversion efficiency calculation.
9. Dynamic sale price simulation based on:
   - meat price per kilogram
   - average selling weight
   - carcass yield
10. Dashboard with charts for:
   - average weight
   - feed consumption
   - accumulated costs
   - production efficiency
11. Financial traffic-light indicator:
   - Green: profit > 15%
   - Yellow: profit between 0% and 15%
   - Red: loss
12. Historical reports per batch.

Required tech stack:

- Next.js (App Router)
- TypeScript
- Prisma ORM
- PostgreSQL
- Tailwind CSS
- Recharts for charts

Generate:
- project architecture
- database schema
- table models
- API routes
- folder structure
- main dashboard components

## AI Agent Integration

The platform includes an embedded AI chat assistant for farm operators. It is **text-only and read-only** — it can query farm data but never modify it.

### Infrastructure
- **App host:** Raspberry Pi 5 — runs the Next.js app + PostgreSQL.
- **LLM host:** Separate Windows machine on the local network running **Ollama** with locally installed models.
- **Communication:** The Next.js backend calls the Ollama HTTP API (`http://<windows-ip>:11434`) over the local network. No data leaves the LAN.
- **Privacy:** All farm data stays on-premise. Queries are sent to the local Ollama instance, never to external cloud APIs.

### Security constraints
- **Read-only access** — the agent can only query the database (SELECT). No inserts, updates, or deletes.
- **No file access** — the agent cannot read, write, or modify any files on either machine.
- **No system commands** — no shell execution, no process spawning.
- **Text-only interface** — plain chat input/output, no file uploads or tool-calling that mutates state.
- **Scoped DB queries** — the backend builds parameterized read-only queries; the LLM never sees raw SQL or connection strings.

### Core capabilities
1. **Natural-language Q&A** — users ask questions about their farm data in plain language (e.g., "Which batch has the best feed conversion this month?") and get answers derived from real database records.
2. **Proactive insights** — the agent analyzes current metrics and surfaces observations:
   - Feed conversion trends
   - Upcoming vaccination/deworming schedules
   - Batches approaching target selling weight
   - Cost anomalies (sudden spikes in feed or expenses)
3. **Sale simulation** — conversational what-if scenarios on sale price, carcass yield, and selling weight.
4. **Report summaries** — on-demand natural-language summaries of batch performance, weekly progress, and financial status.

### Technical direction
- **Ollama API** — call `/api/chat` or `/api/generate` from the Next.js API route. Env var `OLLAMA_BASE_URL` points to the Windows machine.
- **No agent framework** — keep it simple. The backend fetches farm data via Prisma (read-only queries), injects it as context into the prompt, and streams the Ollama response to the client.
- **Conversation history** — store chat messages in a `ChatMessage` table (userId, role, content, timestamp) for context continuity.
- **Raspberry Pi considerations** — the Pi only proxies requests to Ollama; all heavy inference runs on the Windows machine. Keep payloads small and stream responses to avoid memory pressure on the Pi.

### Env vars
```
OLLAMA_BASE_URL="http://<windows-machine-ip>:11434"
OLLAMA_MODEL="llama3"  # or whichever model is installed
```

### Open questions
- Which Ollama model(s) to use? (depends on Windows machine RAM/GPU)
- Max conversation context length before truncation?
- Should chat history persist across sessions or reset on logout?
- Rate limiting per user to avoid overloading the Ollama host?