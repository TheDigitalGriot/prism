---
title: VitePress Documentation Site Research
date: 2026-03-02
topic: prism-docs VitePress site
status: complete
---

# Research: VitePress Documentation Site for Prism

## Summary

The source documentation (`PRISM-DOCUMENTATION-2.3.5.md`, 5,726 lines) lives in `.prism/shared/docs/`. An empty `prism-docs/` directory already exists at the project root. VitePress v2 alpha (tag: `@next`, latest: `2.0.0-alpha.16`) is the correct install target with a stable API.

## Files Discovered

| Path | Purpose |
|------|---------|
| `.prism/shared/docs/PRISM-DOCUMENTATION-2.3.5.md` | Source doc — 5,726 lines, 5 parts |
| `.prism/shared/docs/prism-docs-site-prompt.md` | Full spec for the docs site |
| `prism-docs/` | Empty directory — target for VitePress site |
| `package.json` | Root npm workspaces config |

## Source Document Structure

### Part boundaries (by line number)

| Part | Lines | Section count |
|------|-------|---------------|
| Preamble / Overview | 1–123 | Table of contents + overview table |
| Part I — Claude Plugin | 124–993 | 13 sections |
| Part II — CLI Dashboard | 994–3736 | 20 sections + 11 screens |
| Part III — VS Code Extension | 3737–4468 | 15 sections |
| Part IV — Electron Desktop App | 4469–5512 | 13 sections |
| Part V — Monorepo Architecture | 5513–5726 | 7 sections |

### Key section line numbers

```
Line 1:    # Prism - Complete Documentation v2.3.5
Line 9:    ## Table of Contents
Line 110:  ## Overview (table)
Line 124:  # Part I — Claude Plugin Architecture
Line 128:  ## Plugin Overview
Line 144:  ## Plugin Manifest & Distribution
Line 182:  ## Three-Layer Architecture
Line 229:  ## Commands Reference
Line 298:  ## Agents Reference
Line 349:  ## Skills Reference
Line 448:  ## Scripts & Automation
Line 512:  ## Model Assignment Convention
Line 582:  ## Component Invocation Graph
Line 687:  ## Data Flow Through .prism/
Line 765:  ## Behavioral Principles
Line 821:  ## Plugin Directory Structure
Line 918:  ## Plugin Statistics
Line 994:  # Part II — CLI Dashboard
Line 1053: ## Architecture
Line 1263: ## Getting Started
Line 1339: ## Plugin System
Line 1440: ## Screen Reference (all 11 screens)
Line 2244: ## App Shell
Line 2348: ## Modal & Dialog Systems
Line 2403: ## User Flow Diagrams
Line 2487: ## Execution State Machine
Line 2625: ## Animation System
Line 2678: ## 3D Prism Rendering Pipeline
Line 2778: ## Splash Screen Rendering Pipeline
Line 2821: ## Domain Models
Line 2933: ## Claude CLI Integration
Line 3040: ## Terminal Detection
Line 3087: ## Diff System
Line 3113: ## File Watcher / Persisted UI State / Global Workspace Registry (grouped in spec as config)
Line 3230: ## Keyboard Reference
Line 3397: ## Styling Reference
Line 3496: ## Vertical Layout & Height Budget
Line 3630: ## Configuration
Line 3737: # Part III — VS Code Extension
Line 3739: ## VS Code Extension Overview
Line 3770: ## Extension Architecture
Line 3843: ## Extension Source Structure
Line 3988: ## Core Orchestrator — PrismController
Line 4032: ## IPC Architecture — gRPC-over-postMessage
Line 4070: ## Sidebar Webview
Line 4102: ## Bottom Panel Webview
Line 4137: ## Native Tree Views & Status Bar
Line 4169: ## Commands & Keybindings
Line 4250: ## Extension Settings
Line 4264: ## Workflow State Machine (VS Code)
Line 4291: ## Spectrum Execution (VS Code)
Line 4327: ## Plugin Skill Integration
Line 4377: ## Office Visualization
Line 4410: ## Extension Technology Stack
Line 4469: # Part IV — Electron Desktop App
Line 4473: ## Electron App Overview
Line 4529: ## Electron Architecture
Line 4618: ## Electron Source Structure
Line 4742: ## Main Process & Window Management
Line 4818: ## Preload & Context Bridge
Line 4864: ## IPC Bridge — Electron Transport
Line 4964: ## ElectronPrismController
Line 5073: ## Platform Modules (Electron)
Line 5165: ## Webview UI — React SPA
Line 5257: ## State Management (Electron)
Line 5348: ## Build & Packaging
Line 5430: ## Security Hardening
Line 5462: ## Three-Platform Feature Parity
Line 5513: # Part V — Monorepo Architecture (v2.3.5)
Line 5519: ## Repository Structure
Line 5534: ## npm Workspaces
Line 5557: ## packages/prism-core
Line 5608: ## packages/prism-ui
Line 5679: ## Platform Shell Responsibilities
Line 5692: ## Development Workflow
Line 5712: ## Production Hardening (v2.3.5)
```

## VitePress v2 Alpha API

- **Install**: `npm add -D vitepress@next vue`
- **Version**: `2.0.0-alpha.16` (latest as of Mar 2026)
- **Config**: `defineConfig()` in `.vitepress/config.ts`
- **Theme**: `.vitepress/theme/index.ts` exports `{ extends: DefaultTheme, enhanceApp }`
- **Local search**: `search: { provider: 'local' }` (MiniSearch, built-in)
- **Home page**: `layout: home` frontmatter with `hero:` and `features:` keys
- **Clean URLs**: `cleanUrls: true`
- **Last updated**: `lastUpdated: true`
- **Code line numbers**: `markdown: { lineNumbers: true }`

## Project Structure Decision

Use `prism-docs/` as the self-contained VitePress project root:
```
prism-docs/
├── package.json          ← vitepress@next devDep, scripts (docs:dev/build/preview)
└── docs/                 ← VitePress source root (passed to vitepress CLI)
    ├── .vitepress/
    │   ├── config.ts
    │   └── theme/
    │       ├── index.ts
    │       └── custom.css
    ├── index.md           ← hero page
    ├── overview.md
    ├── plugin/
    ├── cli/
    ├── vscode/
    ├── electron/
    └── monorepo/
```

## Spectral Theme Colors

| Phase | Color | Hex |
|-------|-------|-----|
| Research | Blue (indigo-500) | #6366f1 |
| Plan | Teal | #14b8a6 |
| Implement | Green | #22c55e |
| Validate | Amber | #f59e0b |
