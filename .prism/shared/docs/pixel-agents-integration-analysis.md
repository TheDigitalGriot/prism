# Pixel Agents → Prism VS Code Plugin Integration Analysis

## What Pixel Agents Is

Pixel Agents is a VS Code extension (MIT licensed, ~1.5k stars) that visualizes Claude Code agents as animated pixel art characters in a virtual office. It's **purely observational** — it watches Claude Code's JSONL transcript files at `~/.claude/projects/<hash>/<session-id>.jsonl` and translates tool events into character animations. No modifications to Claude Code are needed.

The key architectural insight: the entire system is a **file watcher → event parser → canvas renderer** pipeline.

---

## Architecture Breakdown

### Backend (Extension Host — Node.js/TypeScript)

| File | Purpose | Prism Relevance |
|------|---------|-----------------|
| `extension.ts` | Entry point, command registration | You already have this pattern |
| `PixelAgentsViewProvider.ts` | WebviewViewProvider, message hub, asset orchestration | **Core integration point** — this is the bridge between VS Code API and the webview |
| `agentManager.ts` | Creates terminals with `claude --session-id <uuid>`, polls for JSONL files | You already have terminal management via prism-cli |
| `fileWatcher.ts` | Hybrid `fs.watch` + polling on JSONL files, detects new tool events | **Reusable directly** — same JSONL files your cchistory module reads |
| `transcriptParser.ts` | Parses JSONL records into typed events (tool start, tool done, status changes) | **Reusable directly** — maps to your existing session models |
| `layoutPersistence.ts` | Reads/writes `~/.pixel-agents/layout.json`, cross-window sync | Could adapt for `~/.prism/` office layout persistence |
| `assetLoader.ts` | PNG → RGBA buffer using `pngjs`, builds sprite sheets | Self-contained, can be extracted |
| `constants.ts` | Magic numbers (poll intervals, tile sizes, etc.) | Reference only |

### Frontend (Webview — React 18 + Vite + Canvas 2D)

| File/Dir | Purpose | Prism Relevance |
|----------|---------|-----------------|
| `App.tsx` | Root React component, state coordination | Entry point for the "Office Mode" view |
| `hooks/useExtensionMessages.ts` | Bidirectional message handler | Pattern to follow for your webview ↔ extension communication |
| `office/engine/characters.ts` | Character state machine: idle → walk → type/read | The visualization core |
| `office/engine/renderer.ts` | Canvas rendering pipeline with Z-sorting | Self-contained rendering engine |
| `office/officeState.ts` | Game world state: characters, furniture, BFS pathfinding | The "model" of the office world |
| `office/editor/` | Full layout editor (paint, erase, place, eyedropper, undo/redo) | Nice-to-have, can add later |
| `office/layout/` | Serialization, furniture catalog, tile system | Layout persistence |
| `office/sprites/` | Sprite data, caching, colorization | Asset management |
| `components/` | React UI overlay (toolbar, agent list, settings) | Adapt to match Prism spectral theme |

### Message Protocol (Backend ↔ Webview)

**Backend → Webview:**
- `layoutLoaded` — initial office layout
- `characterSpritesLoaded` — 6 pre-colored sprite sets
- `furnitureAssetsLoaded` — furniture sprites + catalog metadata
- `agentCreated` — new agent with palette, hue shift, seat assignment
- `agentToolStart` / `agentToolDone` — tool execution state changes
- `agentStatus` — waiting for user input

**Webview → Backend:**
- `webviewReady` — trigger asset loading
- `openClaude` — create new terminal
- `saveLayout` — persist layout changes (debounced)
- `saveAgentSeats` — save seat assignments
- `focusAgent` — focus agent's terminal in VS Code

### Data Flow

```
Claude Code Terminal
    │
    ▼ writes to
~/.claude/projects/<hash>/<session>.jsonl
    │
    ▼ fs.watch + polling
fileWatcher.ts  →  transcriptParser.ts
    │                     │
    ▼                     ▼
PixelAgentsViewProvider   (typed events)
    │
    ▼ postMessage()
Webview (React)
    │
    ▼ useExtensionMessages hook
officeState.ts  →  character state machine
    │
    ▼ requestAnimationFrame
renderer.ts  →  Canvas 2D
```

---

## Integration Strategy for Prism VS Code Plugin

### Concept: "Office Mode" as a Prism View Mode

Your Prism VS Code plugin currently brings prism-cli functionality to the IDE. Pixel Agents becomes an additional **view mode** — think of it like how VS Code has Explorer, Search, Source Control as sidebar modes, but your plugin offers "Stories", "Sessions", and now "Office" as panel modes.

### Option A: Embedded Webview Panel (Recommended)

Add the pixel-agents office as a second webview panel within your existing extension, sharing the same backend services.

**Why this works well:**
- Your extension already has access to `~/.claude/` via cchistory
- The file watcher and transcript parser are self-contained TypeScript modules you can import directly
- The React webview is built with Vite and outputs a single bundle — drop it into your extension's webview assets
- The message protocol is clean and well-defined, easy to bridge to your existing state management

**Architecture:**

```
prism-vscode/
├── src/
│   ├── extension.ts              ← your existing entry point
│   ├── PrismViewProvider.ts      ← your existing webview provider
│   ├── OfficeViewProvider.ts     ← NEW: adapts PixelAgentsViewProvider
│   ├── services/
│   │   ├── sessionService.ts     ← your existing prism session management
│   │   ├── fileWatcher.ts        ← extracted from pixel-agents (or import)
│   │   └── transcriptParser.ts   ← extracted from pixel-agents (or import)
│   └── shared/
│       └── agentBridge.ts        ← bridges Prism sessions ↔ office characters
│
├── webview-office/               ← pixel-agents webview-ui, themed for Prism
│   ├── src/
│   │   ├── App.tsx               ← adapted with spectral theme colors
│   │   ├── office/               ← mostly untouched engine code
│   │   └── components/           ← re-themed toolbar and overlays
│   └── vite.config.ts
│
└── package.json
    contributes:
      views:
        prism-panel:
          - id: prism.storiesView    ← existing
          - id: prism.sessionsView   ← existing
          - id: prism.officeView     ← NEW
```

**Key integration points:**

1. **Agent ↔ Story Mapping**: When a Prism story is being executed by a Claude Code session, the office character for that session gets tagged with the story name. The character's speech bubble could show the current story step instead of just "waiting."

2. **Spectral Theming**: Replace the pixel-agents default color palette with your four-color brand:
   - Blue `#3B82F6` — primary agent color
   - Teal `#14B8A6` — secondary agent / subagent color  
   - Green `#22C55E` — success states / completed tasks
   - Amber `#F59E0B` — waiting / attention needed states

3. **Shared File Watcher**: Your cchistory module already knows how to parse `~/.claude/projects/`. The pixel-agents file watcher does the same thing but for live events. Consolidate into a single watcher service that feeds both the session list and the office visualization.

4. **Story-Aware Characters**: The biggest value-add over vanilla pixel-agents. Characters don't just show tool activity — they show *which story step* they're on. A character working on "PRISM-42: Add dark mode" shows that context in the office.

### Option B: Fork and Merge (More Effort, Full Control)

Fork pixel-agents entirely and merge it into your extension codebase. This gives full control but means maintaining the rendering engine yourself.

**When to choose this:** If you want to deeply modify the canvas rendering (e.g., replacing pixel art with your spectral ASCII art style, or adding the 3D icosahedron as a floating element in the office).

### Option C: Side-by-Side Extension (Quickest)

Just recommend pixel-agents as a companion extension. Your Prism extension could detect it and share session data. Minimal integration effort but no unified experience.

---

## Implementation Plan (Option A)

### Phase 1: Extract and Adapt Backend (2-3 hours)

1. Copy `fileWatcher.ts` and `transcriptParser.ts` from pixel-agents into your `services/` directory
2. Adapt them to work with your existing session service (they share the same JSONL source)
3. Create `OfficeViewProvider.ts` following the `PixelAgentsViewProvider` pattern but using your extension's activation context

```typescript
// agentBridge.ts — the glue between Prism sessions and office characters
interface PrismOfficeAgent {
  sessionId: string;
  storyId?: string;       // links to Prism story if executing one
  storyStep?: string;     // current step name
  characterIndex: number; // 0-5 sprite palette
  seatId?: string;
}
```

### Phase 2: Integrate Webview (3-4 hours)

1. Copy the `webview-ui/` directory as `webview-office/`
2. Update `vite.config.ts` to output to your extension's dist
3. Replace color constants with spectral palette
4. Add Prism-specific overlay components (story labels, progress indicators)
5. Wire `useExtensionMessages` to accept Prism-specific message types

### Phase 3: Add Prism-Specific Features (4-6 hours)

1. **Story tags on characters**: When `agentBridge` knows a session is running a story, inject `storyLabel` into the character state
2. **Click-to-focus story**: Clicking a character opens the Prism story panel for that agent's active story
3. **Epic rooms**: Different "rooms" in the office map to different epics — agents working on the same epic sit in the same area
4. **Status sync**: Prism's story states (researching, planning, implementing, validating) map to character behaviors

### Phase 4: Layout Persistence and Theming (2-3 hours)

1. Store office layout in `~/.prism/office-layout.json` instead of `~/.pixel-agents/`
2. Create a default Prism-themed office layout
3. Add spectral atmospheric effects to the canvas (subtle gradient overlays in your brand colors)

---

## What You Can Reuse Directly (MIT Licensed)

| Component | Lines of Code (approx) | Effort to Adapt |
|-----------|----------------------|-----------------|
| `fileWatcher.ts` | ~150 | Low — just update imports |
| `transcriptParser.ts` | ~200 | Low — already matches your cchistory models |
| `officeState.ts` | ~400 | Medium — add story state fields |
| `characters.ts` (state machine) | ~300 | Medium — add Prism-specific states |
| `renderer.ts` (canvas engine) | ~500 | Low — rendering is self-contained |
| Editor system (full) | ~1000 | Low — use as-is, theme later |
| Asset pipeline (scripts/) | ~800 | Optional — only if creating custom sprites |

**Total extractable code: ~2,500–3,500 lines**, most of which works as-is with minimal adaptation.

---

## Key Technical Considerations

### TypeScript Constraints from Pixel Agents
- `erasableSyntaxOnly: true` — no `enum`, use `as const` objects
- `verbatimModuleSyntax: true` — explicit `import type`
- `noUnusedLocals/Parameters: true`

These are stricter than typical VS Code extensions but produce cleaner code. Worth adopting for the office module.

### Asset Licensing Caveat
The pixel-agents office furniture tileset is **paid** ($2 from itch.io). The characters and basic layout are MIT. For the Prism version, you have three options:
1. Purchase the tileset and run the import pipeline
2. Use basic layout without furniture (still functional)
3. Create custom spectral-themed pixel art assets (aligns with your brand better anyway)

### Canvas vs. Your Existing Webview
If your current Prism VS Code webview uses React, the office webview is also React 18 — you could potentially render both in the same webview with tab/mode switching rather than separate webview providers. This avoids the overhead of a second webview panel.

### Known Limitations to Be Aware Of
- Agent-terminal sync can desync with rapid terminal open/close
- Status detection is heuristic-based (idle timers, not explicit signals)
- Only tested on Windows 11 (you'll need to verify on your platform)
- The JSONL format from Claude Code doesn't have clean "waiting for input" signals

---

## Summary

The cleanest path is **Option A**: add an "Office" view mode to your existing Prism VS Code extension, reusing pixel-agents' file watcher, transcript parser, and canvas rendering engine while adding Prism-specific intelligence (story awareness, spectral theming, epic-based room assignments). The total effort is roughly 12-16 hours, with most of that being theming and Prism-specific features rather than fighting the rendering engine.

The architecture maps naturally: your cchistory module already reads the same `~/.claude/` data that pixel-agents watches. The difference is cchistory reads historically and pixel-agents watches live. Combining them gives you a unified session service that powers both the story management view and the office visualization.
