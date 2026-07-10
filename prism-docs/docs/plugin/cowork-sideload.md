# Cowork Sideload

Distribute the Prism plugin to **Claude Desktop → Cowork** by uploading a packaged zip, bypassing Cowork's GitHub-sync path.

## Why sideload

Cowork installs plugins from a **connected GitHub repo** through a server-side, read-only mount — not the Claude Code CLI's local `git clone` into `~/.claude/plugins/`. Its cache is keyed on an internal plugin/marketplace ID plus a timestamp, **not** the `version` field or the latest commit SHA.

As a result, pushing new commits, bumping the version, or editing the description frequently **fails to propagate** to Cowork, and the marketplace **Update** button is often greyed out or ineffective on the Personal tab (a known, open Cowork bug — see [anthropics/claude-code #69020](https://github.com/anthropics/claude-code/issues/69020), [#38185](https://github.com/anthropics/claude-code/issues/38185), [#45810](https://github.com/anthropics/claude-code/issues/45810)).

Sideloading a zip via **Upload plugin** sidesteps that path entirely.

## The `/prism-sideload` skill

Run it in **Claude Code** — Cowork has no Bash tool, so it can't build the zip itself:

```bash
/prism-sideload
```

It packages only the **tracked** plugin components at `HEAD` — `.claude-plugin`, `skills`, `agents`, `commands`, `hooks`, `scripts` — excluding `apps/`, `packages/`, `prism-docs/`, `prism-eval/`, `installer/`, `node_modules/`, and any nested zips, into:

```
.prism/local/sideload/prism-sideload-<version>.zip
```

That path is gitignored, so a sideload artifact can never re-enter the synced tree and recreate a nested-zip problem. The build verifies that `plugin.json` matches `VERSION` and that there are **zero nested zips** — a nested `.zip` inside the package blocks the Cowork install.

## Upload it in Cowork

**Cowork → Customize → Browse plugins → Upload plugin** → select the zip.

## When to use

| Surface | Update path |
| --- | --- |
| Claude Code CLI / VS Code | `/plugin marketplace update prism-marketplace` + reinstall — works normally |
| Cowork / Claude Desktop | Sideload zip (this workflow) when GitHub-sync serves a stale version |

::: tip
Re-run `/prism-sideload` after committing new plugin changes, then re-upload. When Anthropic fixes Personal-tab GitHub sync, sideloading becomes optional.
:::
