# v2 planning: cloud sync, accounts, sharing, OCR, calendar sync, email forwarding

v1 is fully local (SQLite on-device, no backend, no login). Three of the six v2 ideas from
TODO.md require a backend and accounts; the other three are mostly self-contained. This doc
scopes all six and proposes a build order.

## Dependency graph

```
Accounts / login  ──┬──> Cloud sync ──> Household sharing
                     └──> Email receipt forwarding (needs to know whose inbox)

OCR / AI photo scanning   — independent, works fully offline
Calendar sync              — independent, works fully offline
```

Household sharing and email forwarding are not really "each their own project" — they're
downstream of cloud sync and accounts existing first. Start there if you want either of them.

## Recommended backend: Clerk (auth) + Convex (data + sync)

- **Clerk** for accounts/login — solid Expo/React Native support via `@clerk/clerk-expo`, handles
  sign-in/sign-up UI and session management so you're not hand-rolling auth.
- **Convex** for the backend data store — it's built around exactly this shape of problem
  (reactive queries, offline-tolerant mutations, real-time sync to multiple devices) and has a
  documented first-party Clerk integration (Convex validates the Clerk JWT, no separate user
  table to hand-roll). This avoids building a custom sync engine from scratch.
- Alternative if you'd rather avoid a new vendor: Supabase (Postgres) also integrates with Clerk
  via JWT, but you'd be writing your own sync/conflict logic instead of getting it from the
  platform. More control, more work.

This single backend choice serves cloud sync, household sharing, and (if you build it) email
receipt forwarding's "which account does this email belong to" problem — no need for a second
backend for any of the three.

## 1. Accounts / login

- Add `@clerk/clerk-expo`, wrap the app in `<ClerkProvider>`, build sign-in/sign-up screens.
- Local SQLite data model doesn't change yet — this step is just "who is using the app."
- Decide: is login required to use the app at all, or optional or (like today) fully offline
  until you choose to create an account? Recommend **optional** — v1's offline-first value stays
  intact for anyone who doesn't want an account, and cloud sync becomes an opt-in upgrade.

## 2. Cloud sync

- Once there's an account, item/history writes need to go to Convex instead of (or in addition
  to) local SQLite.
- Local SQLite should stay as the offline cache/source of truth for instant reads and true
  offline use — sync is a background process reconciling local ⇄ Convex, not a replacement for
  local storage. This preserves the "never lose data, works offline" v1 non-negotiable.
- Conflict strategy: simplest workable option is last-write-wins on `updatedAt`, same field
  already tracked on every `Item`. Fine for a single-user-editing-their-own-list app; revisit if
  household sharing means two people edit the same item concurrently.
- Migration concern: existing local-only users (anyone who used v1 before creating an account)
  need a one-time "upload my local data" flow when they first sign in.

## 3. Household sharing

- Needs a "household" or "list" concept in the data model that items belong to, instead of
  items belonging directly to a single user.
- Invite flow: generate a shareable code/link, new member joins the household in Convex.
- Permissions: keep it simple for v1 of this feature — any household member can view/edit/delete
  any item. Role-based permissions (e.g. read-only members) can come later if needed.
- This is the most involved of the six — don't start it before cloud sync is solid.

## 4. OCR / AI photo scanning

- Fully independent of the backend work above — can be built anytime.
- Recommend a vision-capable LLM (e.g. the Claude API) over classical OCR — classical OCR gives
  you raw text, but you still need to parse "which line is the due date." A vision LLM can go
  straight from photo to structured `{ title, dueDate, category }` suggestion in one call.
- Needs a backend proxy for the API call either way (never ship an LLM/OCR API key inside the
  mobile app bundle) — this is a good candidate to run as a Convex action if the Convex backend
  from cloud sync already exists, otherwise it needs a minimal serverless endpoint of its own.
- UX: user taps "scan a document" on Add Item, takes/picks a photo, sees the suggested fields
  pre-filled in the existing form (reusing `ItemForm`) for them to confirm/edit before saving —
  never auto-creates the item without review.

## 5. Calendar sync

- Fully independent, fully local — no backend needed.
- `expo-calendar`: request calendar permission, create/update a calendar event per item mirroring
  its due date, delete the event when the item is deleted or marked done (for non-repeating
  items).
- Same architectural pattern already used for notifications in v1: hook into the data layer
  (`items.ts`) so create/update/delete/markDone automatically keep the calendar in sync, instead
  of every screen having to remember to call it.
- Should be an opt-in Settings toggle, off by default — creating calendar events without asking
  first would be a bad surprise.

## 6. Email receipt forwarding

- Needs: a per-user inbound email address (e.g. via Postmark inbound parsing, or SendGrid/Mailgun
  inbound routes), a backend endpoint to receive the parsed webhook, and a way to map the
  receiving address back to a specific account — which is why this depends on accounts existing.
- Parsing the forwarded email's content into a due date/title is the same "structured extraction"
  problem as OCR — could reuse the same LLM-based extraction approach for consistency instead of
  building two separate parsers.
- Smallest useful v1 of this feature: forwarded email creates a *draft* item the user reviews and
  confirms in-app, not an auto-created item — same "never silently assume" principle already
  applied to due dates elsewhere in this app.

## Suggested order if picking one to start

1. **Calendar sync** or **OCR scanning** — pick whichever you use more, both are self-contained
   and ship value without touching the backend.
2. **Accounts / login** — unlocks the rest.
3. **Cloud sync**.
4. **Household sharing** and/or **email forwarding** — both build on cloud sync + accounts.
