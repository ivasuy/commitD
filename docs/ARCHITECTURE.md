# COMMITD ARCHITECTURE

## OVERVIEW

CommitD is a single-user productivity system with two Next.js apps:

- Dashboard app (root project) for authenticated usage
- Landing app (`landing/`) for marketing and top-of-funnel traffic

The dashboard combines planning, habits, tasks, and finance with Firebase-backed auth/data and Razorpay-backed paid access.

## APPLICATIONS

### DASHBOARD APP (ROOT)

- Runtime: Next.js App Router on port `3001`
- Main responsibility: signed-in product experience
- Protected areas: dashboard, weekly planner, habit tracker, task tracker, finance tracker

### LANDING APP (`landing/`)

- Runtime: Next.js App Router on port `3000`
- Main responsibility: marketing page and traffic handoff to dashboard auth routes

## ROUTING MODEL

### PUBLIC ROUTES

- `/`
- `/signin`
- `/signup`

### PROTECTED ROUTES

- `/dashboard`
- `/weekly-planner`
- `/habit-tracker`
- `/task-tracker`
- `/finance-tracker`

Protected routes are wrapped by `src/app/(protected)/layout.tsx`, which applies `RequireAuth` and shell components.

## AUTHENTICATION AND ACCESS

### AUTH STACK

- Firebase Authentication
- Providers used: Email/Password and Google

### ACCESS CONTROL

`RequireAuth` checks profile entitlement and enforces behavior:

- If access is active: normal page interaction
- If access is expired: content is blurred and a blocking paywall is shown

### TRIAL FLOW

- Endpoint: `POST /api/trial/start`
- Trigger: first protected load for users without trial or paid plan
- Duration: 24 hours
- Storage: trial timestamps in `users/{uid}.profile`

## PAYMENT ARCHITECTURE

### PROVIDER

- Razorpay

### API ROUTES

- `POST /api/razorpay/order`
- `POST /api/razorpay/verify`
- `POST /api/razorpay/subscription`
- `POST /api/razorpay/verify-subscription`
- `POST /api/razorpay/subscription/cancel`

### ACCESS STATES

Access is granted when one of the following is true:

- Active trial
- Active weekly or monthly subscription within period
- Lifetime plan

## DATA ARCHITECTURE

### PRIMARY STORE

- Firestore under `users/{uid}` ownership model

### MAIN COLLECTIONS/DOCS

- `users/{uid}.profile`
- `users/{uid}/weeklyPlanner/{weekStart}`
- `users/{uid}/habitTracker/{monthKey}`
- `users/{uid}/taskTracker/data`
- `users/{uid}/taskTracker/meta`
- `users/{uid}/financeTracker/{monthKey}` (legacy compatibility)
- `users/{uid}/financeTracker/settings`
- `users/{uid}/financeIncomeStreams/{id}`
- `users/{uid}/financeRecurringExpenses/{id}`
- `users/{uid}/financeDebts/{id}`
- `users/{uid}/financeTransactions/{id}`

### CACHING AND WRITE STRATEGY

- In-memory session cache in store modules
- `localStorage` scoped cache keys
- Debounced writes to reduce Firestore write pressure
- Flush-on-blur behavior to avoid data loss on tab switches

## REPOSITORY MODULE MAP

### `src/app`

- Pages, route groups, and API routes
- `src/app/(protected)/layout.tsx` applies auth-protected shell

### `src/components`

- Auth, paywall, app shell, UI primitives, and domain-specific widgets

### `src/lib`

- Firebase client/admin setup
- Firestore data access and migration logic
- Entitlement and payment helpers
- Domain-specific logic for planner/habits/tasks/finance/dashboard

## KNOWN LIMITS

- Multi-user collaboration features are not implemented
- Role-based auth beyond owner-only access is not implemented
- Razorpay webhook directory exists but webhook route implementation is not present
