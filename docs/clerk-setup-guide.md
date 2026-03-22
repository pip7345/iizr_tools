# Clerk Setup Guide

This project uses Clerk for authentication. If you have never used Clerk before, the short version is: Clerk handles sign-up, sign-in, sessions, and user identity, and your app uses Clerk's SDK to decide who is logged in and which routes should be protected.

## What Clerk Is

Clerk is an authentication and user management service. Instead of building login, password reset, email verification, session storage, and account management yourself, you integrate Clerk and let it provide those pieces.

In a Next.js app like this one, Clerk gives you:

- Prebuilt UI for sign-in, sign-up, and user account controls.
- Server-side helpers to read the current session and current user.
- Route protection so unauthenticated users cannot access protected areas.
- A hosted dashboard where you configure your auth settings and copy the keys your app needs.

## Does Clerk Cost Money?

Yes, Clerk is a commercial product, but it does have a free entry tier.

Based on Clerk's pricing page at the time of writing:

- Hobby: free, no credit card required.
- Hobby includes up to 50,000 monthly retained users per app.
- Pro starts at about $20/month billed annually.
- Business starts at about $250/month billed annually.
- Enterprise is custom pricing.

Pricing can change, so treat the official pricing page as the source of truth:

- <https://clerk.com/pricing>

Practical takeaway:

- For a demo, prototype, or small internal app, Clerk can be effectively free.
- For a production app, you should assume there is some vendor cost and review the pricing details before committing to it as a core dependency.

## Does Clerk Depend On An External Service You Do Not Control?

Yes.

Clerk is a hosted third-party authentication platform. Your app depends on Clerk infrastructure for identity operations such as sign-in, sign-up, session handling, and token refresh.

According to Clerk's architecture docs, when you create a Clerk application, Clerk provisions a hosted frontend API instance for your app. In development, this is hosted on a Clerk-controlled domain such as `*.clerk.accounts.dev`, and your app uses the publishable key to locate and communicate with that service.

What that means in practice:

- You need a Clerk account and a Clerk application in their dashboard.
- Your authentication flow depends on Clerk-managed services being reachable.
- Part of your auth behavior and configuration lives outside your repository, in the Clerk dashboard.
- You do not fully control the auth infrastructure in the same way you would if you ran your own auth service and database.

That does not mean your app data must live in Clerk. In this repo, application data still lives in PostgreSQL via Prisma. But identity and session management are delegated to Clerk.

## What You Still Control

Even with Clerk in the stack, you still control:

- Your application code.
- Your PostgreSQL database and Prisma schema.
- Which routes are protected.
- Which Clerk user fields you copy into your own `User` table.
- How tightly or loosely your domain model depends on Clerk-specific IDs.

In this repo, Clerk is the identity provider, while Prisma/PostgreSQL remain the source of truth for project data.

## Advantages Of Using Clerk

- Fast setup. You can add working authentication to a Next.js app quickly.
- Less auth code to write and maintain. Password flows, sessions, account UI, and common auth edge cases are largely handled for you.
- Good Next.js integration. Clerk provides middleware, server helpers, client hooks, and prebuilt components.
- Polished user flows. Sign-in, sign-up, profile management, and session handling are already implemented.
- Security work is partially outsourced. You benefit from a vendor that focuses on auth infrastructure, session handling, and auth UX.
- Easier path to advanced features. MFA, organizations, impersonation, and related features are easier to adopt than building them yourself.

## Disadvantages Of Using Clerk

- Vendor dependency. Your auth layer depends on a third-party company and service.
- External control plane. Some critical configuration lives in the Clerk dashboard, not only in code.
- Ongoing cost risk. Even if development starts free, production scale or premium features may cost money.
- Migration cost later. If you remove Clerk later, you will need to replace middleware, session handling, user sync logic, UI components, and auth assumptions in your app.
- Operational dependency. If Clerk has an outage or account issue, sign-in and session flows can be affected.
- Data governance and compliance review. Depending on your use case, using a third-party identity service may require legal, privacy, residency, or compliance review.
- Less total control. If your requirements are unusual, you may find the hosted model constraining compared with a fully self-managed auth system.

## Advantages Of A Non-Clerk Alternative

By "alternative that doesn't require creating an account on a third-party website," you are usually talking about self-managed authentication or a library-first approach where you run the auth system yourself.

Advantages of that approach:

- More control. You own the auth stack, data model, and deployment path.
- Fewer vendor dependencies. No external auth dashboard is required.
- Potentially lower long-term cost at scale, depending on your team and infrastructure.
- Easier to satisfy strict internal policies if your organization wants auth infrastructure fully under its own control.
- Better fit for highly custom flows if you are willing to build and maintain them.

## Disadvantages Of A Non-Clerk Alternative

- More engineering work. You have to implement and maintain more of the auth system yourself.
- More security responsibility. Password storage, session invalidation, email verification, password reset, rate limiting, bot protection, and MFA become your problem.
- Slower time to first working product. Auth is rarely the most important differentiator in an app, but it can consume a lot of time.
- More UI and edge-case work. Auth flows have many annoying details, especially around sessions, redirects, expired links, and multi-device behavior.
- You need to design operational procedures. That includes secrets rotation, email delivery, abuse handling, audits, and incident response.

## Clerk Vs A Self-Managed Alternative

Use Clerk when:

- You want to ship quickly.
- Authentication is not the main product you are building.
- You are comfortable relying on a hosted service for identity.
- You want polished prebuilt auth UI and minimal implementation work.

Use a self-managed alternative when:

- You want maximum control over the auth stack.
- Your organization does not want a third-party hosted identity dependency.
- You have compliance, sovereignty, or procurement constraints.
- You are willing to spend engineering time building and maintaining auth infrastructure.

## Bottom-Line Recommendation For This Repo

For this specific sample project:

- Clerk is convenient if your goal is to get the demo working quickly.
- Clerk is probably the wrong fit if your main concern is avoiding third-party auth dependencies entirely.

If you only want the app running with minimal effort, configuring real Clerk keys is the shortest path.

If you want full control and no external auth vendor, the right move is not more Clerk configuration. The right move is replacing Clerk with a different auth approach.

## How Clerk Works In This Repo

This repo already has Clerk wired in. These are the important integration points:

- [src/app/layout.tsx](/e:/arbitrage/iizr_tools/src/app/layout.tsx): wraps the app in `ClerkProvider`, which makes Clerk available throughout the UI.
- [src/proxy.ts](/e:/arbitrage/iizr_tools/src/proxy.ts): runs `clerkMiddleware()` and protects `/dashboard` routes.
- [src/lib/auth/user.ts](/e:/arbitrage/iizr_tools/src/lib/auth/user.ts): uses `auth()` and `currentUser()` on the server to read the logged-in user and synchronize that user into Prisma.
- [src/app/(auth)/sign-in/[[...sign-in]]/page.tsx](/e:/arbitrage/iizr_tools/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx): sign-in route.
- [src/app/(auth)/sign-up/[[...sign-up]]/page.tsx](/e:/arbitrage/iizr_tools/src/app/(auth)/sign-up/[[...sign-up]]/page.tsx): sign-up route.

The basic request flow is:

1. A user visits the app.
2. Clerk UI components show sign-in or account controls depending on session state.
3. Protected routes go through Clerk middleware in `src/proxy.ts`.
4. Server-side code uses Clerk helpers to identify the current user.
5. This app stores a matching local `User` row in Prisma, so Clerk remains the auth source of truth while PostgreSQL stores app-specific data.

## Why You Need Two Keys

Clerk uses two main credentials in local development:

- Publishable key: safe to expose to the browser. The frontend uses this to initialize Clerk.
- Secret key: server-only. Backend code uses this to securely talk to Clerk.

You will usually see these prefixes:

- Development publishable key: `pk_test_...`
- Production publishable key: `pk_live_...`
- Development secret key: `sk_test_...`
- Production secret key: `sk_live_...`

The current error in this repo happened because `.env` still contains placeholders:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your_key"
CLERK_SECRET_KEY="sk_test_your_key"
```

Those are examples, not real credentials.

## How To Get Real Clerk Keys

1. Go to the Clerk dashboard: <https://dashboard.clerk.com/>
2. Sign up or sign in.
3. Create a new application.
4. Choose the authentication methods you want for development. Email/password is the simplest starting point.
5. After the app is created, open the application's API Keys or Developers section in the dashboard.
6. Copy the publishable key and the secret key for your development instance.

Important:

- Use development keys locally, not production keys.
- Never expose the secret key in client-side code.
- If Clerk gives you an unclaimed development instance first, claim/configure it in the dashboard so it is tied to your account.

## How To Configure `.env` In This Repo

This repo expects these Clerk-related environment variables:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
```

Your `.env` should end up looking roughly like this:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/iizr_tools"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/iizr_tools"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxxxxxxx"
CLERK_SECRET_KEY="sk_test_xxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
```

Notes:

- The publishable key must use the `NEXT_PUBLIC_` prefix in this repo so Next.js exposes it to the browser.
- The secret key must not have a `NEXT_PUBLIC_` prefix.
- Keep the sign-in and sign-up URLs as they are unless you move those routes.

After editing `.env`, restart the dev server:

```powershell
npm run dev
```

## Recommended Clerk Dashboard Settings For This App

For this project, use these settings in Clerk:

- Sign-in URL: `/sign-in`
- Sign-up URL: `/sign-up`
- Post-auth redirect target: `/dashboard`
- Allowed local origin: `http://localhost:3000`

If you see redirect or origin errors later, the first thing to verify is that your Clerk application allows your local development URL.

## What Happens After Sign-In

Once Clerk is configured and a user signs in:

1. Clerk creates and manages the authenticated session.
2. `auth()` can read the session on the server.
3. `currentUser()` can load the user's Clerk profile.
4. This app writes or updates a matching user row in PostgreSQL via Prisma.
5. Project records in the database are then associated with that local user row.

That is why Clerk and Prisma are both present here: Clerk handles identity; Prisma handles your application data.

## Common Mistakes

- Using placeholder keys from `.env.example` instead of real keys.
- Copying a secret key into the publishable key variable.
- Forgetting to restart `npm run dev` after changing `.env`.
- Using production keys locally.
- Not adding `http://localhost:3000` to the Clerk app's allowed local origins or redirect configuration.

## Useful Resources

- Clerk docs home: <https://clerk.com/docs>
- Clerk pricing: <https://clerk.com/pricing>
- Clerk Next.js App Router quickstart: <https://clerk.com/docs/nextjs/getting-started/quickstart>
- Clerk environment variables reference: <https://clerk.com/docs/guides/development/clerk-environment-variables>
- Clerk Next.js SDK overview: <https://clerk.com/docs/reference/nextjs/overview>
- How Clerk works: <https://clerk.com/docs/guides/how-clerk-works/overview>
- Clerk dashboard: <https://dashboard.clerk.com/>
- Clerk Next.js demo repo: <https://github.com/clerk/clerk-nextjs-demo-app-router>

## Minimal Setup Checklist

1. Create a Clerk application in the dashboard.
2. Copy the development publishable key.
3. Copy the development secret key.
4. Put both into [e:\arbitrage\iizr_tools\.env](/e:/arbitrage/iizr_tools/.env).
5. Keep sign-in and sign-up URLs set to `/sign-in` and `/sign-up`.
6. Restart the dev server.
7. Open <http://localhost:3000> and test sign-up.

## If You Want To Remove Clerk Later

That is possible, but it is a code change, not just an env change. You would need to remove or replace:

- `ClerkProvider`
- Clerk UI components
- `clerkMiddleware()` in `src/proxy.ts`
- `auth()` and `currentUser()` usage
- protected route assumptions around `/dashboard`

If your goal is only to get this demo running, configuring real Clerk keys is the shortest path.