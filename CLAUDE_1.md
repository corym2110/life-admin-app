# Life Admin App — Project Brief (v1)

## What this is
A mobile app (iPhone + Android) that reminds people before anything in their life
expires or needs maintenance: house, car, documents, subscriptions, health.

Promise: "Never miss a renewal, expiry, or maintenance task again. No surprise charges."

## Stack (do not change without asking)
- Expo (React Native) + TypeScript
- Expo Router for navigation
- expo-sqlite for on-device storage (offline-first, no backend in v1)
- expo-notifications for local reminders
- expo-image-picker for photos (stored in app document directory)
- expo-file-system + expo-sharing for backup and CSV export

## v1 scope — build ONLY this
### Screens
1. **Home** — sections: Overdue, Due this month, Coming up (next 90 days). Tap item → detail.
2. **Add / Edit Item** — title, category, due date, repeat rule, reminder offsets, notes, photo.
3. **Item Detail** — info, photo, "Mark done" button, history list.
   - "Mark done" logs a HistoryEntry and, if repeating, sets the next due date automatically.
4. **Categories** — Home, Car, Documents, Subscriptions, Health.
   Each has starter items the user can tick on (see Starter Items).
5. **Settings** — notification defaults, backup/restore (JSON), export CSV, Pro unlock (stub).

### Data model
```
Item {
  id: string
  title: string
  category: 'home' | 'car' | 'documents' | 'subscriptions' | 'health'
  dueDate: string            // ISO date
  repeat: { every: number, unit: 'day' | 'week' | 'month' | 'year' } | null
  reminderOffsets: number[]  // days before due, default [30, 7, 1]
  notes: string
  photoUris: string[]
  lastDoneAt: string | null
  createdAt: string
  updatedAt: string
}

HistoryEntry {
  id: string
  itemId: string
  doneAt: string
  note: string
}
```

### Starter items (user ticks what applies at onboarding)
- Home: furnace filter (3 mo), smoke/CO detector batteries (1 yr), dryer vent clean (1 yr),
  gutter clean (6 mo), water heater flush (1 yr), home insurance renewal (1 yr)
- Car: oil change (6 mo), registration renewal (1 yr), insurance renewal (1 yr),
  tire swap (6 mo), driver's licence renewal
- Documents: passport expiry, health card expiry
- Subscriptions: custom (user adds name + renewal date)
- Health: dental cleaning (6 mo), eye exam (1–2 yr)

Starter items ask for the due date on add; never assume one.

## Non-negotiables (these are what competitors get wrong)
- **Never lose data.** All writes are transactional. Deleting an item needs confirmation
  and offers Undo. Auto-backup JSON to app storage weekly.
- **Export always available**, free tier included. Users own their data.
- **Reminders reschedule** whenever an item changes or is marked done. Cancel stale ones.
- **Android parity.** Test every feature on both platforms.
- **No dark patterns.** No nag screens. Pro is offered in Settings and at the free limit only.

## Free vs Pro
- Free: up to 15 items, all core features, export.
- Pro (stub in v1, wire up payments later): unlimited items, household sharing (v2),
  cloud sync (v2).

## NOT in v1
Cloud sync, accounts/login, household sharing, OCR/AI photo scanning, calendar sync,
email receipt forwarding. Don't build these. Suggest them in a TODO list instead.

## Build order
1. Scaffold Expo + Router + TypeScript; confirm it runs in Expo Go.
2. SQLite schema + data layer (items, history) with tests for next-due-date math.
3. Home screen with seeded fake data.
4. Add/Edit + Item Detail + Mark done.
5. Notifications scheduling/rescheduling.
6. Categories + starter-item onboarding.
7. Settings: backup/restore, CSV export, free-limit check.
8. Polish: empty states, dark mode, icons.

Work one step at a time. Commit after each step. Stop and summarize before moving on.
