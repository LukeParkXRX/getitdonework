# Pre-Launch Manual Test Guide

> Target site: **https://getitdonework.com**
> Date: 2026-05-29 · Purpose: Full end-to-end verification before the official launch with US partners
> Payments currently run in **manual credit grant mode**. Stripe live payments will be enabled after the US Stripe account verification is complete.

---

## 0. What you need

| Item | Value |
|------|-------|
| Startup account | Log in with a real Google or email account |
| Enabler account | Log in with a real approved enabler account |
| super_admin | `admin@getitdonework.com` or `luke@xrx.studio` |
| Admin notification recipients | `admin@getitdonework.com`, `luke@xrx.studio`, `sson@xrx.studio` |
| Credit grant | super_admin grants credits manually from `/admin/credits` |
| Video session test | **2 devices or 2 browsers** (one startup + one enabler, connected at the same time) |
| Recommended browsers | Chrome, Safari, mobile Safari (iPhone), mobile Chrome (Android) |

> How to mark: write `[O]` pass / `[X]` fail / `[-]` N/A next to each box. For failures, record a **screenshot + URL + steps to reproduce**.

---

## 1. Sign-up / Authentication

- [ ] **Email sign-up** (`/signup`): invalid email / short password shows a clear error
- [ ] Valid sign-up → confirmation email received → click link → can log in
- [ ] **Google sign-in** (`Continue with Google`) works
- [ ] **Failed login**: wrong password shows a clear message ("check email or password")
- [ ] **Password reset**: `Forgot password?` → email → reset → log in with new password
- [ ] **2FA**: enable in `/settings/security` → log out → re-login prompts for a code
- [ ] After logout, protected pages (`/bookings`, `/messages`, `/settings`) redirect to `/login`
- [ ] **Terms-of-service modal**: new/unaccepted accounts see the consent modal on login; `Decline` logs out

---

## 2. Startup journey (core funnel)

### 2-1. Discover enablers → request a match
- [ ] `/enablers` list/cards render correctly (name, affiliation, **profile photo**, expertise, availability status)
- [ ] Filter / search (school, field, etc.) works
- [ ] Enabler detail (`/enablers/[id]`) shows bio, reviews, availability
- [ ] **Match request** (chemistry / standard / project) is created and appears in the request list

### 2-2. Manual credit grant before Stripe verification
- [ ] `/credits` info page renders (1 credit = $100)
- [ ] `/credits` purchase buttons are disabled and marked as payment coming soon
- [ ] Log in as super_admin → `/admin/credits` → grant credits to the real startup account
- [ ] Log back in as the startup → **credit balance increases**
- [ ] Booking with insufficient balance → shows a clear insufficient-credit message

### 2-3. Booking → session
- [ ] Book a session (pick a time) from a confirmed match → shows as `Confirmed` in `/bookings`
- [ ] **`/bookings` filter tabs** (All / Pending / Confirmed / Completed / Cancelled) — counts correct, click filters
- [ ] Entry button activates **from 15 min before** the scheduled time ("Enter now"); before that shows "Enter in N min"
- [ ] **90 min after** the scheduled time shows "Session expired" + entry disabled
- [ ] **On mobile (375px), the filter tabs must not get cut off / overflow** (recently fixed — please confirm)

### 2-4. Review after a session
- [ ] Write a **rating + review** on a completed session → status becomes "Reviewed"
- [ ] Right after a session, visiting `/bookings?review=<id>` **auto-opens the review modal** (only for completed, not-yet-reviewed sessions)
- [ ] Closing the modal → re-entering does not force it again

---

## 3. Video session (LiveKit) — requires 2 people at once ⭐ most important

> Run with a startup account (device A) + an enabler account (device B) **connected simultaneously**.

- [ ] **Pre-call lobby**: camera/mic preview, permission prompt, device selection
- [ ] Both join → session starts, remote video/audio received correctly
- [ ] **Session header**: "Session in progress · elapsed time (00:00 → counting up)", "Scheduled end" time shown
- [ ] Screen share / mute / camera off controls work
- [ ] **Network drop → auto-reconnect** (briefly turn Wi-Fi off to test)
- [ ] **Close tab / reload shows an exit warning** (protects the paid session)
- [ ] One side clicks "End session" → both go to `/meeting/session-ended`
- [ ] **End-page CTA** branches correctly: startup → "View my bookings" (`/bookings`), enabler → "To dashboard" (`/enabler-dashboard`)
- [ ] **Refund if ended under 5 minutes**; 5+ minutes deducts credits normally
- [ ] Lobby/session layout holds on mobile (buttons large enough, video area height capped)

---

## 4. Enabler journey

- [ ] Log in → `/enabler-dashboard`
- [ ] Receive a **new match request (pending)** → accept / decline
- [ ] On accept, startup is notified and the upcoming-sessions list updates
- [ ] **Upcoming sessions** entry-button state (active 15 min before / "expired" after) matches the startup side
- [ ] In-progress sessions (start → within 90 min) also appear in the list
- [ ] Run a session → end → settlement reflects it
- [ ] **Tax forms** (W-9 / W-8BEN) upload works (US experts)
- [ ] Earnings / payout history displays

---

## 5. Admin

> Log in as `admin@getitdonework.com` or `luke@xrx.studio` super_admin

- [ ] Admin dashboard access (confirm a normal account cannot reach it)
- [ ] **Manual credit grant/revoke** modal → target startup balance updates after running
- [ ] Launch checklist / tax-form management screens
- [ ] User / booking / payment history lookup

---

## 6. Localization / common UX

- [ ] **KO ⇄ EN toggle** — key pages (home, enabler list, dashboard) translate correctly, no broken keys
- [ ] From a US-partner perspective, **English copy reads naturally** (check for literal translations / typos)
- [ ] Loading states (spinner / skeleton) appear
- [ ] Empty states (0 bookings, 0 search results) show guidance + CTA
- [ ] Error states (network failure, 404) are friendly — `404` page confirmed working
- [ ] Cookie consent banner works (accept / decline / settings)
- [ ] Footer shows one **Legal Center** link, and `/legal` shows the policy side menu:
  - `/terms` — Terms of Service v1.3
  - `/privacy` — Privacy Policy v1.0
  - `/refund` — Refund Policy v1.0
  - `/acceptable-use` — Acceptable Use Policy v1.0
  - `/cookie-policy` — Cookie Policy v1.0
  - `/dpa` — Data Processing Agreement v1.0
- [ ] Terms consent modal appears for accounts that have not accepted the current `v1.3` terms

---

## 7. Non-functional (performance / security / accessibility)

- [ ] **Mobile responsive**: no horizontal scroll / clipping on iPhone Safari & Android Chrome
- [ ] **Slow network** (Chrome DevTools → Network → Slow 3G): key pages still load
- [ ] **Cross-browser**: Chrome / Safari / (Edge if possible) layouts match
- [ ] Direct-URL access to protected pages/APIs while logged out is blocked
- [ ] Broken images/avatars show a fallback (no broken-image icon)
- [ ] No red console errors (F12 → Console) on key pages

---

## 8. Already found in automated checks (FYI)

| # | Location | Issue | Status |
|---|----------|-------|--------|
| 1 | `/bookings` filter tabs | On mobile 375px the tab row overflowed and clipped "Cancelled" | **Fixed — please confirm** |
| 2 | 3 E2E tests | `/admin` (now 404) and `/credits` (public info page) expectations don't match reality — **not a security issue**, test specs need updating | Code cleanup |
| 3 | Public apply/contact forms | **Anonymous submit returned 500 (RLS) → not saved** — `/enabler-apply` and `/contact` intake were blocked by an RLS + row read-back conflict. Switched to service-role; **fixed, deployed, live-verified (HTTP 200)** | **Fixed** |
| 4 | `/enablers` (public) | Only one real enabler ("Luke Park") and its school/degree/specialty/location are placeholder "TEST". Test switch already off (`SHOW_TEST_DATA=false`). **Before launch**: recruit a real enabler pool (see `ENABLER_ONBOARDING_GUIDE.md`) + clean up this profile | Data/recruiting |
| 5 | `/enablers` (public) | Enablers with real availability now appear first. Cards show `Availability set` or `No open times yet` so testers can choose a bookable profile faster. | **Fixed — please confirm** |

---

## 9. Result-logging template

```
[Item] 2-3 Book a session
[Env] iPhone 15 / Safari / Wi-Fi
[Result] X
[Symptom] "Cancelled" tab clipped off the right edge
[Repro] Open /bookings → page scrolls horizontally
[Screenshot] (attached)
```

After testing, send back just the failed items in the format above.
