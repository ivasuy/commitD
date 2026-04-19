# COMMITD

CommitD (formerly LockIn) is a two-app monorepo:

- Dashboard app (root): authenticated productivity workspace on `http://localhost:3001`
- Landing app (`landing/`): marketing site on `http://localhost:3000`

## FEATURES

- Weekly planner (`/weekly-planner`)
- Habit tracker (`/habit-tracker`)
- Task tracker (`/task-tracker`)
- Finance tracker (`/finance-tracker`)
- Aggregated dashboard (`/dashboard`)
- Firebase auth + Firestore persistence + Razorpay paywall

## SETUP

### 1) INSTALL DEPENDENCIES

```bash
npm install
npm --prefix landing install
```

### 2) CREATE ENV FILES

Create root env file for dashboard app:

```bash
cp .env.example .env.local
```

Optional landing env file:

```bash
cat > landing/.env.local <<'EOF'
NEXT_PUBLIC_DASHBOARD_URL=http://localhost:3001
EOF
```

### 3) REQUIRED SERVICES

- Firebase project with:
  - Authentication (Email/Password and Google providers)
  - Firestore database
- Razorpay account with:
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`
  - `RAZORPAY_PLAN_ID_WEEKLY`
  - `RAZORPAY_PLAN_ID_MONTHLY`

### 4) START APPS

Run each app in a separate terminal:

```bash
# terminal 1 (dashboard)
npm run dev

# terminal 2 (landing)
npm run dev:landing
```

### 5) OPEN URLS

- Landing: `http://localhost:3000`
- Dashboard: `http://localhost:3001`

## SCRIPTS

### ROOT APP

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

### LANDING APP

- `npm run dev:landing`
- `npm run build:landing`
- `npm run start:landing`

Manual typecheck:

```bash
npx tsc --noEmit
```

## DOCUMENTATION

- `docs/ARCHITECTURE.md`
- `docs/DOCKER.md`
