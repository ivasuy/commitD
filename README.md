# CommitD

**Weekly planning, habits, tasks, and finances — one system, one dashboard.**

Your productivity tools are scattered across five apps. CommitD brings them into a single dark-themed workspace so you stop context-switching and start executing.

---

## Demo

| Landing Page | Dashboard |
|:---:|:---:|
| <img src="docs/landing.gif" width="400" alt="CommitD landing page"/> | <img src="docs/dashboard.gif" width="400" alt="CommitD dashboard"/> |
| Marketing site with animated shader hero | Authenticated workspace with live analytics |

---

## Features

- **Weekly Planner** — drag-and-drop weekly schedule with time blocks and carry-forward for unfinished items
- **Habit Tracker** — daily habit streaks with monthly heatmap visualization
- **Task Tracker** — priorities (high/medium/low/optional), status tracking, and distribution analytics
- **Finance Tracker** — income streams, recurring expenses, debts, and monthly transaction logging
- **Aggregated Dashboard** — summary cards, weekly progress chart, and task analytics across all modules

All data syncs to Firebase in real-time with debounced writes and flush-on-blur to prevent data loss.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| UI | shadcn/ui, Lucide icons |
| Animation | Framer Motion, Paper Design Shaders |
| Charts | Recharts |
| Auth | Firebase Authentication (Email + Google) |
| Database | Cloud Firestore |
| Payments | Razorpay (weekly/monthly subscriptions + lifetime) |

---

## Architecture

Two-app monorepo:

```
commitd/
├── src/                    # Dashboard app (port 3001)
│   ├── app/                # Pages, API routes, protected layout
│   ├── components/         # Auth, paywall, shell, domain widgets
│   ├── hooks/              # Custom React hooks
│   └── lib/                # Firebase, Firestore, entitlement logic
├── landing/                # Landing app (port 3000)
│   └── src/                # Marketing site with shader hero
├── docs/                   # Architecture and deployment docs
└── mobile/                 # Mobile app (planned)
```

**Access control:** Protected routes are wrapped by `RequireAuth`, which checks profile entitlement. Expired access blurs content and shows a blocking paywall. New users get a 24-hour trial automatically on first protected page load.

---

## Quick Start

### 1. Install dependencies

```bash
npm install
npm --prefix landing install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in your Firebase and Razorpay credentials. See `.env.example` for all required variables.

### 3. Start both apps

```bash
# Terminal 1 — Dashboard
npm run dev

# Terminal 2 — Landing
npm run dev:landing
```

### 4. Open

- Landing: http://localhost:3000
- Dashboard: http://localhost:3001

---

## Required Services

**Firebase** — create a project with Authentication (Email/Password + Google providers) and Firestore database.

**Razorpay** — create an account and set up subscription plans for weekly and monthly billing. You'll need `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_PLAN_ID_WEEKLY`, and `RAZORPAY_PLAN_ID_MONTHLY`.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dashboard on port 3001 |
| `npm run dev:landing` | Start landing on port 3000 |
| `npm run build` | Build dashboard for production |
| `npm run build:landing` | Build landing for production |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Type check without emitting |

---

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — system design, data model, routing, and access control
- [Docker](docs/DOCKER.md) — containerized deployment

---

## License

MIT
