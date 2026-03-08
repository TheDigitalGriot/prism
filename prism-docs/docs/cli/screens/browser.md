---
title: Browser Screen
description: Playwright browser verification dashboard with sessions, history, and artifacts
outline: [2, 3]
---

# Browser Screen

A Playwright browser verification dashboard that monitors automated browser sessions, tracks verification history, and manages screenshot/artifact files. Three-panel layout.

## Types

- **`BrowserSessionInfo`**: SessionID, URL, CreatedAt, Action (`"created"`, `"closed"`, `"error"`)
- **`BrowserVerificationRecord`**: StoryID, CheckType (`"screenshot"`, `"console"`, `"snapshot"`, `"network"`), Status (`"pass"`, `"fail"`), ArtifactPath, Details, Timestamp
- **`BrowserArtifact`**: Path, Name, Size, Timestamp, StoryID

## UI Layout

```
╭──────── 1/3 ────────╮╭──────── 1/3 ─────────╮╭──────── 1/3 ────────────────╮
│ SESSIONS             ││ HISTORY               ││ ARTIFACTS                   │
│ ────────────────    ││ ──────────────────    ││ ───────────────────────    │
│                      ││                       ││                             │
│ ● abc123  localhost  ││ ✓ STORY-001 screenshot││ screenshot-001.png  45KB   │
│   Created 2m ago     ││ ✓ STORY-001 console   ││ snapshot-002.html   12KB   │
│                      ││ ✗ STORY-002 network   ││ console-003.log     3KB    │
│ ○ def456  localhost  ││ ✓ STORY-003 snapshot  ││                             │
│   Closed  5m ago     ││                       ││                             │
│                      ││                       ││                             │
╰──────────────────────╯╰───────────────────────╯╰─────────────────────────────╯
```

## Event Subscriptions

- `"browser.verification"` — Adds records to history panel
- `"browser.session"` — Adds/updates entries in sessions panel

Periodic artifact scanning runs every 10 seconds to discover new files on disk.

## Key Bindings

| Key | Panel | Action |
|-----|-------|--------|
| `Tab` | Any | Cycle focus: Sessions → History → Artifacts |
| `Shift+Tab` | Any | Cycle focus backward |
| `j` / `↓` | Any | Navigate items within focused panel |
| `k` / `↑` | Any | Navigate items within focused panel |
| `Enter` | Sessions | View session details |
| `Enter` | History | View verification details |
| `Enter` | Artifacts | Open artifact preview |
| `r` | Any | Refresh panels |
| `Esc` / `Backspace` | Any | Focus Home |
