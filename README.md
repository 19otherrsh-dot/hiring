# HireFlow

AI-assisted hiring platform (npm workspaces monorepo).

| Path | What |
|---|---|
| `apps/web` | React 19 + Vite frontend (PWA) |
| `services/core-api` | Fastify + Prisma API (port 3001) |
| `services/ai-matching` | FastAPI matching service (port 8000) |
| `packages/` | Shared packages (currently empty) |
| `docker-compose.yml` | Postgres (5433), Redis, OpenSearch, Kafka |

## Prerequisites

- Node.js 20+ (developed on Node 24, npm 11)
- Docker + Docker Compose
- Python 3.10+ (only for `services/ai-matching`)

## Setup

```bash
git clone https://github.com/19otherrsh-dot/hiring.git
cd hiring

# 1. Env file (gitignored) — the example has the working dev values
cp services/core-api/.env.example services/core-api/.env

# 2. Dependencies
npm install

# 3. Infrastructure
docker compose up -d

# 4. Database schema + seed data
cd services/core-api
npx prisma db push
npx tsx prisma/seed.ts
cd ../..

# 5. (Optional) AI matching service
cd services/ai-matching
python -m venv .venv
.venv/Scripts/activate      # Windows; use `source .venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
python main.py
cd ../..

# 6. Run web + API
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:3001

Seeded logins (password `password123`): `sarah@acmecorp.com` (recruiter), `priya.patel@outlook.com` (candidate).
