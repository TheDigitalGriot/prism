# Claude Code Prompt — Prism Documentation Site (VitePress)

> Paste this into Claude Code at your repo root (or wherever you want the docs site to live).

---

```
Create a VitePress documentation site for the Prism project using the v2 alpha (`vitepress@next`). The source content is in PRISM-DOCUMENTATION-2_3_5.md — a single 5,700+ line markdown file that needs to be split into individual pages. Install with `npm add -D vitepress@next vue`.

## Setup

- Initialize VitePress in a `docs/` directory with TypeScript config
- Use `npm` as the package manager
- Enable local search (MiniSearch) — no Algolia
- Set `base` to `'/'` (can be changed later for GitHub Pages)

## Content Structure

Split PRISM-DOCUMENTATION-2_3_5.md into individual markdown files following this hierarchy. Preserve ALL content — don't summarize or truncate anything. Every code block, table, diagram, and section must survive the split intact.

```
docs/
├── index.md                          # Landing/hero page
├── overview.md                       # The Overview table + intro
├── plugin/
│   ├── index.md                      # Plugin Overview + What Makes It Different
│   ├── manifest.md                   # Plugin Manifest & Distribution
│   ├── architecture.md               # Three-Layer Architecture
│   ├── commands.md                   # Commands Reference
│   ├── agents.md                     # Agents Reference
│   ├── skills.md                     # Skills Reference
│   ├── scripts.md                    # Scripts & Automation
│   ├── model-assignment.md           # Model Assignment Convention
│   ├── invocation-graph.md           # Component Invocation Graph
│   ├── data-flow.md                  # Data Flow Through .prism/
│   ├── behavioral-principles.md      # Behavioral Principles
│   ├── directory-structure.md        # Plugin Directory Structure
│   └── statistics.md                 # Plugin Statistics
├── cli/
│   ├── index.md                      # CLI Overview
│   ├── architecture.md               # Architecture
│   ├── getting-started.md            # Getting Started
│   ├── plugin-system.md              # Plugin System
│   ├── screens/
│   │   ├── splash.md                 # Splash Screen
│   │   ├── onboarding.md             # Onboarding Screen
│   │   ├── home.md                   # Home Screen
│   │   ├── research.md               # Research Screen
│   │   ├── plans.md                  # Plans Screen
│   │   ├── spectrum.md               # Spectrum Execution Dashboard
│   │   ├── files.md                  # Files Screen
│   │   ├── git.md                    # Git Screen
│   │   ├── agent.md                  # Agent Screen
│   │   ├── monitor.md                # Monitor Screen
│   │   └── workspaces.md             # Workspaces Screen
│   ├── app-shell.md                  # App Shell (Tab Bar, Sidebar, Footer)
│   ├── modals.md                     # Modal & Dialog Systems
│   ├── user-flows.md                 # User Flow Diagrams
│   ├── state-machine.md              # Execution State Machine
│   ├── animation.md                  # Animation System
│   ├── 3d-rendering.md               # 3D Prism Rendering Pipeline
│   ├── splash-rendering.md           # Splash Screen Rendering Pipeline
│   ├── domain-models.md              # Domain Models
│   ├── claude-integration.md         # Claude CLI Integration
│   ├── terminal-detection.md         # Terminal Detection
│   ├── diff-system.md                # Diff System
│   ├── keyboard.md                   # Keyboard Reference
│   ├── styling.md                    # Styling Reference
│   ├── layout.md                     # Vertical Layout & Height Budget
│   └── configuration.md              # Configuration
├── vscode/
│   ├── index.md                      # VS Code Extension Overview
│   ├── architecture.md               # Extension Architecture
│   ├── source-structure.md           # Extension Source Structure
│   ├── controller.md                 # Core Orchestrator — PrismController
│   ├── ipc.md                        # IPC Architecture — gRPC-over-postMessage
│   ├── sidebar.md                    # Sidebar Webview
│   ├── bottom-panel.md               # Bottom Panel Webview
│   ├── tree-views.md                 # Native Tree Views & Status Bar
│   ├── commands.md                   # Commands & Keybindings
│   ├── settings.md                   # Extension Settings
│   ├── state-machine.md              # Workflow State Machine
│   ├── spectrum.md                   # Spectrum Execution
│   ├── plugin-skills.md              # Plugin Skill Integration
│   ├── office.md                     # Office Visualization
│   └── tech-stack.md                 # Extension Technology Stack
├── electron/
│   ├── index.md                      # Electron App Overview
│   ├── architecture.md               # Electron Architecture
│   ├── source-structure.md           # Electron Source Structure
│   ├── main-process.md               # Main Process & Window Management
│   ├── preload.md                    # Preload & Context Bridge
│   ├── ipc-bridge.md                 # IPC Bridge — Electron Transport
│   ├── controller.md                 # ElectronPrismController
│   ├── platform-modules.md           # Platform Modules
│   ├── webview-ui.md                 # Webview UI — React SPA
│   ├── state-management.md           # State Management
│   ├── build.md                      # Build & Packaging
│   ├── security.md                   # Security Hardening
│   └── feature-parity.md             # Three-Platform Feature Parity
└── monorepo/
    ├── index.md                      # Repository Structure
    ├── workspaces.md                 # npm Workspaces
    ├── prism-core.md                 # packages/prism-core
    ├── prism-ui.md                   # packages/prism-ui
    ├── platform-shells.md            # Platform Shell Responsibilities
    ├── dev-workflow.md               # Development Workflow
    └── production-hardening.md       # Production Hardening (v2.3.5)
```

## Navigation Config

Set up the sidebar with collapsible groups matching the 5 parts:

- **Part I — Claude Plugin** (plugin/)
- **Part II — CLI Dashboard** (cli/) with a nested "Screens" sub-group
- **Part III — VS Code Extension** (vscode/)
- **Part IV — Electron Desktop App** (electron/)
- **Part V — Monorepo Architecture** (monorepo/)

Top nav should have:
- Left: "Prism" logo/text with tagline
- Right nav links: Guide, CLI, VS Code, Electron, Monorepo
- GitHub link (use https://github.com placeholder)

## Hero Landing Page (index.md)

Create a compelling hero page using VitePress's built-in hero layout with:
- Name: "Prism"
- Tagline: "AI-Driven Development Workflow Suite"
- Description referencing the 4-phase workflow (Research → Plan → Implement → Validate)
- Three action buttons: Get Started → /overview, CLI Dashboard → /cli/, VS Code Extension → /vscode/
- Features section highlighting the three platforms (CLI, VS Code, Electron)

## Spectral Theme

This is the most important part. Override VitePress's default theme CSS variables to use Prism's spectral palette. The four workflow phases map to these colors:

```
Research  → Blue   #6366f1 (indigo-500)
Plan      → Teal   #14b8a6 (teal-500)  
Implement → Green  #22c55e (green-500)
Validate  → Amber  #f59e0b (amber-500)
```

Create `.vitepress/theme/index.ts` that extends the default theme with custom CSS. Apply these overrides in `.vitepress/theme/custom.css`:

### Dark Mode (primary — this is a dev tool)
- Background: #0a0a0f (very dark, near-black with slight blue)
- Surface/sidebar: #12121a
- Elevated surface: #1a1a25
- Text primary: #e2e8f0
- Text secondary: #94a3b8
- Brand/accent color: Use the Blue #6366f1 as `--vp-c-brand-1`
- Brand hover: #818cf8
- Brand soft bg: rgba(99, 102, 241, 0.14)
- Code block bg: #0f0f18
- Border color: rgba(99, 102, 241, 0.15)
- Sidebar active: Blue accent with soft glow

### Light Mode
- Keep it clean but use the same brand blue as accent
- Lighter versions of the spectral colors for badges and highlights

### Spectral Gradient
Add a subtle spectral gradient bar (blue → teal → green → amber) as a decorative element:
- Top border of the page (2-3px)
- Hero section background uses a very faint version of this gradient

### Custom Components (optional but nice)
- Phase badges that use the four spectral colors
- Custom code block styling with the dark background
- Sidebar group icons or colored indicators for each Part

### VitePress CSS Variable Overrides
Override these specific VitePress variables:
```css
:root {
  --vp-c-brand-1: #6366f1;
  --vp-c-brand-2: #818cf8;
  --vp-c-brand-3: #4f46e5;
  --vp-c-brand-soft: rgba(99, 102, 241, 0.14);
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: linear-gradient(135deg, #6366f1 0%, #14b8a6 40%, #22c55e 70%, #f59e0b 100%);
  --vp-home-hero-image-background-image: linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(20, 184, 166, 0.3) 50%, rgba(245, 158, 11, 0.3) 100%);
}

.dark {
  --vp-c-bg: #0a0a0f;
  --vp-c-bg-soft: #12121a;
  --vp-c-bg-mute: #1a1a25;
  --vp-sidebar-bg-color: #0f0f18;
  --vp-code-block-bg: #0f0f18;
  --vp-c-text-1: #e2e8f0;
  --vp-c-text-2: #94a3b8;
  --vp-c-divider: rgba(99, 102, 241, 0.12);
  --vp-c-gutter: rgba(99, 102, 241, 0.08);
}
```

### Top Spectral Bar
Add a fixed 3px gradient bar at the very top of the viewport:
```css
body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #6366f1, #14b8a6, #22c55e, #f59e0b);
  z-index: 999;
}
```

## Content Processing Rules

When splitting the markdown:
1. Add proper frontmatter to each page with `title` and `description`
2. Fix internal anchor links to point to the correct new page paths
3. Preserve all code blocks with their language annotations
4. Preserve all tables exactly as-is
5. Preserve all mermaid/ASCII diagrams as code blocks
6. Add "Edit this page" links if possible
7. Use VitePress features like custom containers (:::tip, :::warning) where the content has callouts
8. Add `outline: [2, 3]` to pages with deep heading structures so the right-side TOC shows h2 and h3

## Additional Config

In `.vitepress/config.ts`:
- `lastUpdated: true`
- `cleanUrls: true`
- Enable local search with MiniSearch
- Set `markdown.lineNumbers: true` for code blocks
- `head` should include a meta description and favicon placeholder

## Final Checks

After creating everything:
1. Run `npm run docs:dev` to verify it builds
2. Check that all sidebar links resolve correctly
3. Verify code blocks have syntax highlighting
4. Confirm the spectral theme renders in dark mode
5. Test the search functionality works across all pages
```

---

## Usage Notes

- Run this from your Prism repo root, with `PRISM-DOCUMENTATION-2_3_5.md` accessible in the working directory
- After it scaffolds, you can fine-tune the theme by editing `docs/.vitepress/theme/custom.css`
- To deploy to GitHub Pages later, just change `base` in config to `'/prism/'` (or whatever your repo name is)
- The prompt uses `vitepress@next` (v2 alpha) — some APIs may shift between alpha releases, but it's fine for personal use
