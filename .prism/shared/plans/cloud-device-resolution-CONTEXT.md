# Stage contract — cl-plugin-structure: Cloud / device resource resolution

## Inputs (exact paths)
- **Working file (edit this):** `C:\Users\digit\GriotApps\Prism\skills\cl-plugin-structure\SKILL.md` (currently version 0.7.4)
- **Reference (do not edit):** the "Portable Paths" and "Components" sections already in that file; the sibling repo `C:\Users\digit\GriotMeta\digital-griot-skills\README.md` (has the standalone-skill version of this pattern).

## Locked decisions (do not re-litigate)
1. This is an ADD-IN-PLACE doc change. Do NOT strip, reword, or reorder any existing content. Insert one new section and bump the version. Nothing else.
2. Insert the new section **immediately after the `## Portable Paths` section** (it is about resolving bundled paths, so it belongs next to Portable Paths).
3. The exact section text to insert is given verbatim in "Section to insert" below. Insert it byte-for-byte (you may fix only obvious markdown-table rendering issues if a pipe is malformed; otherwise verbatim).
4. Bump `version:` in the YAML frontmatter from `0.7.4` to `0.7.5`.
5. Do NOT git commit, push, or sync to the marketplace. Leave the working tree dirty for human review.

## Process (numbered)
1. Read the working file; locate the `## Portable Paths` section and the line where it ends (the next `## ` heading after it).
2. Insert the "Section to insert" text as a new `## Cloud / device resource resolution` block right before that next heading. Emit heartbeat `HB:inserted`.
3. Edit the frontmatter `version: 0.7.4` -> `version: 0.7.5`. Emit heartbeat `HB:versioned`.
4. From the plugin root `C:\Users\digit\GriotApps\Prism`, run `claude plugin validate .` and capture the result. Emit heartbeat `HB:validated <PASS|FAIL>`.
5. Print a short report: the exact insertion line number, the new version, and the validation result. Emit heartbeat `HB:done`.

## Success criteria
- The new `## Cloud / device resource resolution` section exists exactly once, immediately after Portable Paths.
- `version: 0.7.5` in the frontmatter.
- All previously-existing sections still present, unchanged (byte-diff should show only the inserted block + the version line).
- `claude plugin validate .` passes clean.
- No commit/push performed.

## Heartbeat tokens
Emit these to stdout as you go: `HB:start`, `HB:inserted`, `HB:versioned`, `HB:validated <PASS|FAIL>`, `HB:done`.

---

## Section to insert (verbatim)

## Cloud / device resource resolution

A skill's bundled `references/` `scripts/` `assets/` are not equally reachable everywhere. Two independent facts about a **Cowork cloud** session decide how to resolve them — apply the matrix, and bake the matching block into any resource-bundled skill:

| | Read a bundled doc | Run a bundled script |
|---|---|---|
| **Standalone skill** (distributed via `save_skill` -> SKILL.md only) | device-side · `Get-Content C:\Users\digit\.claude\skills\<name>\<path>` | device-side · Windows-MCP PowerShell / `claude.exe -p` |
| **Plugin skill** (installed via a plugin) | `PLUGIN_ROOT/<path>` — ships with the plugin, present in the cloud | device-side · Cowork has **no Bash tool** |

Why: (1) `save_skill` uploads only the SKILL.md, so a standalone skill's bundled files never travel to the cloud account — they live on-device (`~/.claude/skills/<name>/`) and in the source repo. A plugin ships its whole folder, so its files resolve via `PLUGIN_ROOT`. (2) Cowork has **no Bash tool** (see the Components table), so **no** skill can *execute* a bundled script in-cloud — scripts always run device-side via the Windows-MCP PowerShell bridge or `claude.exe -p` headless. On **desktop / CLI** everything is local and the resolution is a no-op.

**Required block.** Any skill that bundles files MUST carry a short "Resources — cloud / device resolution" block near the top, in the variant that matches how it is distributed:

- **Standalone variant** (skills shipped via `save_skill`): read + execute both route device-side to `C:\Users\digit\.claude\skills\<name>\…`.
- **Plugin variant** (skills shipped inside a plugin): read via `PLUGIN_ROOT/<path>`; execute device-side (Cowork has no Bash). Never assume a relative `scripts/…` path executes in the cloud.

If the device bridge is unavailable, say so and fall back to the inline instructions — never silently fail. `create-fragment` emits the correct variant automatically for scaffolded skills.
