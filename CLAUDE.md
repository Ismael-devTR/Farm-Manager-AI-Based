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