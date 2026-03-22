# iizr_tools

Production-ready Next.js starter using App Router, TypeScript, Tailwind CSS, Prisma, PostgreSQL, Clerk authentication, Zod validation, and Server Actions.

## Quick start

If you just want to run the app locally, do this:

1. Install Docker Desktop.
2. Start Postgres:

```powershell
docker compose up -d
```

3. Copy the env file:

```powershell
Copy-Item .env.example .env
```

4. Add your Clerk keys to `.env`.
5. Install dependencies:

```powershell
npm install
```

6. Create the database schema:

```powershell
npm run db:migrate
```

7. Start the app:

```powershell
npm run dev
```

8. Open `http://localhost:3000`.

## Local database on localhost

The simplest option is Docker. This repo includes a local PostgreSQL container configuration.

### Option A: Docker Desktop

1. Install Docker Desktop for Windows.
2. Start the database:

```powershell
docker compose up -d
```

3. Check that Postgres is running:

```powershell
docker ps
```

4. Stop it when you are done:

```powershell
docker compose down
```

Default local database settings:

- Host: `localhost`
- Port: `5432`
- Database: `iizr_tools`
- Username: `postgres`
- Password: `postgres`

### Option B: Native PostgreSQL install

If you do not want Docker, install PostgreSQL 16 or newer and create the database manually:

```powershell
createdb -U postgres iizr_tools
```

Then keep the same values from `.env.example`.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript 5
- Tailwind CSS 4
- Prisma ORM 7
- PostgreSQL via Neon or Supabase
- Clerk auth
- Vercel deployment target

## Folder structure

```text
.
├── prisma/
│   └── schema.prisma
├── src/
│   ├── actions/
│   │   └── project-actions.ts
│   ├── app/
│   │   ├── (app)/
│   │   │   ├── dashboard/
│   │   │   │   ├── error.tsx
│   │   │   │   ├── loading.tsx
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (auth)/
│   │   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   │   └── sign-up/[[...sign-up]]/page.tsx
│   │   ├── (marketing)/
│   │   │   └── page.tsx
│   │   ├── global-error.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── dashboard/
│   │   └── ui/
│   └── lib/
│       ├── auth/
│       ├── db/
│       ├── validation/
│       ├── env.ts
│       └── utils.ts
├── middleware.ts
└── .env.example
```

## Required dependencies

Runtime:

- next
- react
- react-dom
- @clerk/nextjs
- @prisma/client
- zod
- clsx
- tailwind-merge
- server-only

Development:

- typescript
- prisma
- tailwindcss
- @tailwindcss/postcss
- eslint
- eslint-config-next

## Step-by-step setup

1. Install dependencies.

```bash
npm install
```

2. Copy the environment template.

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Start PostgreSQL locally with `docker compose up -d`, or create a hosted database in Neon or Supabase.

4. Add values to `.env`:

- `DATABASE_URL`: database connection string used by the app.
- `DIRECT_URL`: direct connection string used by migrations.
- `NEXT_PUBLIC_APP_URL`: local app URL, usually `http://localhost:3000`.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk publishable key.
- `CLERK_SECRET_KEY`: Clerk secret key.
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`: `/sign-in`.
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`: `/sign-up`.

5. Create the Clerk application.

- Set sign-in URL to `/sign-in`.
- Set sign-up URL to `/sign-up`.
- Set the post-auth redirect to `/dashboard`.
- Add `http://localhost:3000` to allowed origins.

6. Generate Prisma client and apply the first migration.

```bash
npm run db:migrate
```

7. Start the dev server.

```bash
npm run dev
```

8. Open `http://localhost:3000`, sign up, then create a project from the dashboard.

## Prisma schema

The initial schema includes:

- `User`: local app user mapped to `clerkId`
- `Project`: example owned resource for authenticated CRUD
- `ProjectStatus`: `ACTIVE` and `ARCHIVED`

This pattern keeps Clerk as the auth source of truth while Prisma owns application data.

## Server Action example

The example CRUD flow lives in `src/actions/project-actions.ts` and demonstrates:

- authenticated mutation via `requireUser()`
- Zod validation on the server
- Prisma writes without a REST layer
- `revalidatePath("/dashboard")` after mutations

## Protected routes

Protection is applied at three layers:

1. `middleware.ts` protects `/dashboard` requests early.
2. `src/app/(app)/layout.tsx` calls `auth.protect()` for protected UI.
3. Each Server Action verifies the session again before database access.

That redundancy is intentional. Middleware is a UX boundary, not the only security control.

## Environment variables

See `.env.example` for the full set. The optional helper in `src/lib/env.ts` shows how to validate env values with Zod where needed.

## Vercel deployment

1. Push the repository to GitHub.
2. Create a Vercel project and import the repo.
3. Set all environment variables from `.env.example` in Vercel.
4. Set `DATABASE_URL` to the pooled connection string.
5. Set `DIRECT_URL` to the direct connection string.
6. Keep the install command as `npm install`.
7. Keep the build command as `npm run build`.
8. Run migrations during deployment or as a release step with:

```bash
npm run db:deploy
```

9. In Clerk, add the Vercel production domain to allowed origins and redirect URLs.

## Useful scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run db:migrate
npm run db:deploy
npm run db:studio
```

## Notes

- This starter intentionally avoids REST endpoints for the example CRUD flow.
- Add Route Handlers only when you truly need webhook receivers, third-party callbacks, or client-consumable endpoints.
- For production hardening, consider adding rate limiting, audit logging, Sentry, and a stricter Content Security Policy.
