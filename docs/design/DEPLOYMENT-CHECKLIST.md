# Deployment Checklist

Deployment target: **Vercel** (Next.js) + **Neon** (PostgreSQL) + **Clerk** (Auth)

---

## 1. Accounts to Create

| Service | URL | Purpose | Account created? | Notes |
|---|---|---|---|---|
| GitHub | https://github.com | Host the repository | ☐ | Required by Vercel import |
| Vercel | https://vercel.com | Host the Next.js app | ☐ | Free Hobby tier is sufficient to start |
| Neon | https://neon.tech | Managed PostgreSQL (pooled + direct URLs) | ✅ | Account and project created |
| Clerk | https://clerk.com | Authentication & user management | ☐ | Free tier up to 10,000 MAU |

---

## 2. Repository

- Github public repository: https://github.com/pip7345/iizr_tools
---

## 3. Neon — Database Setup


### 3a. Initialize the Neon CLI (one-time, local machine)

```powershell
npx neonctl@latest init
```

This authenticates your local machine with Neon. Follow the prompts to sign in via browser and select your project.

### 3b. Get both connection strings

Neon requires **two** connection strings:

| Variable | Which string | Where to find it |
|---|---|---|
| `DATABASE_URL` | **Pooled** (PgBouncer) | Neon dashboard → Connection Details → toggle **Pooled connection** ON |
| `DIRECT_URL` | **Direct** (non-pooled) | Neon dashboard → Connection Details → toggle **Pooled connection** OFF |

Prisma uses `DATABASE_URL` for queries at runtime and `DIRECT_URL` for migrations. Both are required.

> **Tip:** The connection string you already have (starting with `postgresql://neon_owner…`) is the direct string. Use it as `DIRECT_URL`. Go back to the Neon dashboard and enable the **Pooled connection** toggle to get the separate `DATABASE_URL`.

- [x] Copy **pooled** connection string → `DATABASE_URL` in `.env` and Vercel
  ```
  postgresql://neondb_owner:xxxxx@ep-odd-king-anhs1w04-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
  ```
- [x] Copy **direct** connection string → `DIRECT_URL` in `.env` and Vercel
  ```
  postgresql://neondb_owner:xxxxx@ep-odd-king-anhs1w04.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
  ```
- [x] Save both strings in a password manager before closing the Neon dashboard

### 3c. Apply migrations to the Neon database

The Neon database starts empty. Push your schema to it by running the migrations:

```powershell
npm run db:deploy
```

This runs `prisma migrate deploy` over the `DIRECT_URL` and creates all tables defined in `prisma/migrations/`. You should see each migration listed as applied.

> **Note:** `prisma db pull` does the opposite — it imports an existing remote schema into your local `schema.prisma`. Do not use it here; your local schema is the source of truth.

- [ ] Run `npm run db:deploy` and confirm all migrations applied successfully
- [ ] Verify tables exist in the Neon dashboard under **Tables**

---

## 4. Clerk — Auth Setup

- [ ] Create a new Clerk application
- [ ] Choose sign-in method (email, OAuth, etc.)
- [ ] Copy **Publishable Key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] Copy **Secret Key** → `CLERK_SECRET_KEY`
- [ ] Set **Sign-in URL** to `/sign-in`
- [ ] Set **Sign-up URL** to `/sign-up`
- [ ] Set **Post-auth redirect URL** to `/dashboard`
- [ ] Add `http://localhost:3000` to allowed origins (for local testing)
- [ ] *(After Vercel deploy)* Add the production domain to allowed origins
- [ ] *(After Vercel deploy)* Add the production domain to redirect URLs

---

## 5. Vercel — Project Setup

- [ ] Create a new Vercel project
- [ ] Import the GitHub repository
- [ ] Set framework preset to **Next.js** (auto-detected)
- [ ] Set the following environment variables in Vercel project settings:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `DIRECT_URL` | Neon direct connection string |
| `CLERK_SECRET_KEY` | From Clerk dashboard |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | From Clerk dashboard |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_APP_URL` | Production URL (e.g. `https://iizr-tools.vercel.app`) |

- [ ] Keep install command as `npm install`
- [ ] Keep build command as `npm run build`
- [ ] Deploy the project (first deploy)

---

## 6. Database Migration

Run migrations against the production database after the first deploy:

```bash
npm run db:deploy
```

This can be run locally (pointing at the Neon `DIRECT_URL`) or added as a Vercel release command.

- [ ] Run `npm run db:deploy` against production database
- [ ] Confirm all tables exist in Neon console

---

## 7. Post-Deploy Verification

- [ ] Visit the production URL — landing page loads
- [ ] Sign up for a new account — Clerk redirects to `/dashboard`
- [ ] Promote the first account to admin via the database or seed script
- [ ] Confirm admin panel is accessible
- [ ] Test referral link flow: `/api/referral?referral=CODE` sets cookie and redirects to `/sign-up`
- [ ] Confirm invite creation, edit, and delete work on dashboard
- [ ] Confirm credit history is visible

---

## 8. Credentials Log

> Fill this in as credentials are created. Store actual secret values in a password manager — **never commit them to the repo**.

| Item | Assigned to | Location stored |
|---|---|---|
| Neon `DATABASE_URL` (pooled) | neondb_owner | Password manager |
| Neon `DIRECT_URL` (direct) | neondb_owner | Password manager |
| Clerk Secret Key | — | — |
| Vercel project URL | — | — |
| GitHub repository URL | — | — |
| First admin user email | — | — |
