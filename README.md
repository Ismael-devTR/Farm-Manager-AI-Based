# Farm Manager

A web application for managing pig fattening operations. Track batches, feed consumption, expenses, weekly weights, and vaccination schedules — with automatic cost calculations, FCR, profitability indicators, and feed projections.

Built with Next.js 16 App Router, Prisma, PostgreSQL, and Tailwind CSS v4.

---

## Features

- **Batch management** — entry date, animal count, birth age, initial weight, cost per animal
- **Weekly weight tracking** — per-batch records with automatic avg/gain calculations
- **Feed consumption** — date, type, quantity (kg), cost per kg; FCR computed automatically
- **Expense tracking** — vaccines, dewormers, vitamins, and other costs
- **Vaccination & deworming schedule** — plan and mark treatments as done
- **Cost dashboard** — total cost, cost per animal, cost per kg produced
- **Feed projections** — daily consumption rate, estimated remaining feed and days to target weight
- **Sale price simulator** — revenue, profit, and margin based on meat price, selling weight, and carcass yield; traffic-light indicator (green > 15%, yellow 0–15%, red = loss)
- **Charts** — avg weight, feed consumption, accumulated costs, cost breakdown, feed projection with actual vs. projected overlay
- **i18n** — Spanish and English, switchable without page reload
- **Responsive** — desktop sidebar + mobile drawer

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL 16 |
| ORM | Prisma v7 (`@prisma/adapter-pg`) |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Auth | Stateless JWT via `jose` (httpOnly cookie) |
| Passwords | `bcryptjs` |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for the database)

### 1. Clone and install

```bash
git clone https://github.com/your-username/farm-manager.git
cd farm-manager
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Required variables:

```env
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=farm_manager
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/farm_manager
SESSION_SECRET=a-random-secret-of-at-least-32-characters
```

### 3. Start the database

```bash
docker compose up -d
```

### 4. Run migrations and seed

```bash
npx prisma migrate deploy
npx prisma db seed
```

The seed creates two default users:

| Email | Password |
|---|---|
| `admin@farm.com` | `admin123` |
| `user@farm.com` | `user123` |

> Change these passwords after your first login.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

---

## Database Schema

```
User
Batch ──< WeightRecord
      ──< FeedRecord
      ──< Expense
      ──< VaccinationSchedule
```

All child records cascade-delete when a batch is removed.

---

## Project Structure

```
app/
  (auth)/login/         — Login page
  (dashboard)/
    dashboard/          — Overview with stats and active batches
    batches/            — Batch list, creation form, and detail page
lib/
  actions/              — Server Actions (batch, weight, feed, expense, schedule)
  calculations.ts       — Pure cost, FCR, and projection calculations
  prisma.ts             — Prisma singleton
  session.ts            — JWT session helpers
components/
  charts/               — Recharts chart components
locales/                — en.ts / es.ts dictionaries
prisma/
  schema.prisma
  seed.ts
```

---

## Contributing

Pull requests are welcome. For major changes please open an issue first to discuss what you would like to change.

---

## License

[MIT](LICENSE)
