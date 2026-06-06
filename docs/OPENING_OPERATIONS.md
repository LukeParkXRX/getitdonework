# Official Opening Operations

Last updated: 2026-06-06

This document is for the Get It Done official opening period.

## Current Operating Mode

- The site is open in **manual credit mode**.
- Stripe live card payment is not the launch blocker.
- Until the U.S. Stripe account is fully approved, admins grant credits manually.
- Credit grants are managed from `/admin/credits`.
- The public `/credits` page explains credits, but checkout is not active yet.

## Account Flow

### Startup

- A startup can sign up directly with Google or email.
- After login, the startup can complete its profile and browse Enablers.
- To book paid sessions before Stripe is ready, an admin must grant credits first.

### Enabler

- Enablers should not create a normal account first.
- They should submit the Enabler application from `/enabler-apply`.
- Admins review the application.
- Approved Enablers receive the next-step account flow from the team.
- Approved Enablers are shown publicly only after the basic profile is complete:
  name, school, degree, location, bio, and specialties.
- If an approved Enabler is incomplete, the site hides that profile from `/enablers`
  until admins complete it or move it back to pending.

### Admin

- The fixed super_admin accounts are:
  - `admin@getitdonework.com`
  - `luke@xrx.studio`
- Admin alert recipients are:
  - `admin@getitdonework.com`
  - `luke@xrx.studio`
  - `sson@xrx.studio`

## What Admins Do Before Stripe

1. Confirm the startup has an account.
2. Open `/admin/credits`.
3. Grant credits to that startup.
4. Add a clear memo, for example: `Manual grant before Stripe verification`.
5. Ask the startup to refresh and confirm the credit balance.
6. The startup can then book sessions using the granted credits.

## What Is Still Manual

- Real startup signup testing
- Real Enabler application review
- Real Enabler profile completion and availability setup
- Manual credit grant and booking test
- LiveKit two-person call test
- Email inbox delivery checks
- Sentry project setup in Vercel

## What Is Checked Automatically

Run these before launch checks:

```sh
bun run audit:prod
bun run test:unit
E2E_BASE_URL=https://getitdonework.com bun run e2e
```

The automatic checks cover:

- Production environment readiness
- Manual credit mode
- Required admin notification recipients
- Fixed super_admin account roles
- Test email and placeholder data exposure
- Incomplete public Enabler profiles
- Public Enabler availability
- Public page availability
- Signup form basics
- Credits page and checkout blocking before Stripe
- Mobile horizontal overflow on key pages
- `/api/health` structure

## Current Known Warning

Sentry may still show as a warning in `/api/health`.

This means:

- The site can still run.
- Database, manual credits, LiveKit, Resend, admin notifications, and rate limiting can still be healthy.
- Production errors will not be sent to Sentry until `NEXT_PUBLIC_SENTRY_DSN` is added.
