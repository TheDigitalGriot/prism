---
date: 2026-09-06
topic: "Codex-Orchestration - cross-provider model routing, role model, effort handling"
subject_repo: C:\Users\digit\GriotSandbox\xplatform-harvest\Codex-Orchestration
upstream: https://github.com/Cjbuilds/Codex-Orchestration
version_examined: plugin 0.9.3 (unreleased) @ 2c0a4b8 "Raise Advisor review limit to eight (#32)"
licence: MIT
relevance: Arkestra (the Governor) provider axis; prism-model-onboard
mode: documentarian
---

# Codex-Orchestration - how Anthropic models actually run inside Codex

Evidence base: 63 files / 36 Python / 27,687 lines. Single commit in the local clone
(`2c0a4b8`). All line references are to the working tree as harvested.

## Architecture (file:line)

A **Codex** plugin (not a Claude plugin). Three layers.

**1. Manifests / declaration**

| Path | Role |
|---|---|
| `plugins/codex-orchestration/.codex-plugin/plugin.json:1-44` | plugin id, version `0.9.3`, `"skills": "./skills/"`, `"mcpServers": "./.mcp.json"` |
| `plugins/codex-orchestration/.mcp.json:1-28` | three stdio MCP launcher variants, **all `"enabled": false`** (`:9`, `:17`, `:25`) |
| `.agents/plugins/marketplace.json:1-20` | marketplace entry, `"authentication": "ON_INSTALL"` |
| `plugins/.../agents/openai.yaml:1-7` | Codex interface block, `allow_implicit_invocation: true` |

**2. The contract (prompt layer)**

- `skills/codex-orchestration/SKILL.md:1-707` - the whole orchestration behaviour.
  707 lines of instruction; the coordination loop lives here (`:603-632`), not in code.
- `references/providers-and-models.md:1-356` - capability matrix, routing honesty
  vocabulary, savings arithmetic.
- `references/external-models.md:1-268` - trust lanes, lifecycle table, secret handling.

**3. The executable layer (`skills/codex-orchestration/scripts/`)**

| Script | Lines | Responsibility |
|---|---|---|
| `configure_native_routing.py` | 2538 | setup/status/repair/disable; writes the four Codex config fields; renders the policy prose |
| `configure_orchestration.py` | 3618 | native custom-agent `.toml` files, provider pins, legacy migration |
| `external_configurator.py` | 1873 | External Model lifecycle: prepare / gate0 / connect / ready / resolve / **sealed `invoke`** |
| `fable_advisor_mcp.py` | 912 | **the Anthropic bridge** - JSON-RPC MCP server over stdio |
| `routing_state.py` | 357 | fail-closed validator for the persisted roster |
| `external_registry.py` | 305 | schema-1 non-secret registry, atomic CAS writes |
| `external_providers.py` | 184 | bundled provider-manifest validation + effort resolution |
| `external_credentials.py` | 222 | installs the OS-credential-store helper |
| `external_auth_helper.py` | 258 | Keychain / secret-tool / Windows Credential Manager reader |
| `external_readiness.py` | 206 | 16-state readiness enum + legal-transition graph |
| `external_subscription.py` | 164 | sealed dispatch wrapper over the Claude bridge |
| `external_cli_trust.py` | 160 | binary fingerprint + sanitized env |
| `inspect_models.py` | 194 | host catalog diagnostics |

Two persisted state files, both at the top of `CODEX_HOME`:
- `~/.codex/.codex-orchestration-routing.json` - the seat roster (`fable_advisor_mcp.py:26`)
- `~/.codex/.codex-orchestration-external-models.json` - external providers/roles
  (`external_registry.py:20`), mode `0600` on POSIX (`:241`)

---

## Cross-provider invocation + billing

### The actual mechanism

There is **no protocol translation**. The plugin does not convert Anthropic Messages to
the Responses wire API; `providers-and-models.md:284` says so ("An Anthropic Messages
endpoint is not automatically compatible"). Instead it **shells out to the official
Claude Code CLI** from an MCP server that Codex loads.

Full chain:

1. Codex root model calls MCP tool `create_plan` / `revise_plan` / `review_plan`
   (`fable_advisor_mcp.py:753-810` tool defs; `:849-874` dispatch).
2. `_invoke_fable` (`:507-605`) reloads the seat from disk (`load_fable_route:326-337`
   -> `_read_routing_state:276-306`), re-checks auth, then builds argv:

```
claude --print --model <sealed-id> --effort <saved-effort>
       --safe-mode --tools "" --permission-mode dontAsk
       --no-session-persistence --prompt-suggestions false
       --output-format json --system-prompt <role-prompt>
       [--json-schema <PLAN_REVIEW_SCHEMA>]      # review only, :543-553
```
(`fable_advisor_mcp.py:523-553`)

3. The task packet goes **on stdin only** (`subprocess.run(..., input=prompt, ...)`
   `:555-564`), 600 s timeout (`:52`), 200,000-char combined input cap (`:55`,
   enforced `:340-350`).
4. Output must be JSON; `_normalize_model_payload` (`:409-442`) accepts exactly one
   `result` event; `_validate_runtime_models` (`:357-406`) authorizes the reported
   `modelUsage` **before** any model-authored text is interpreted (`:582-584`).

### Which credential - and whose account is billed

**The plugin holds no Anthropic credential at all.** It requires and verifies a
first-party *subscription* login owned by the user.

`check_claude_auth` (`fable_advisor_mcp.py:255-273`) runs `claude auth status --json`
and requires **all four**:
- `loggedIn is True`
- `authMethod == "claude.ai"`
- `apiProvider == "firstParty"`
- `subscriptionType in {"pro", "max", "team"}`

Anything else raises `AdvisorError` -> seat unavailable. API-key auth is therefore
**structurally impossible**, not merely discouraged: `SENSITIVE_ENV` (`:68-119`) is a
52-name denylist covering `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`,
`ANTHROPIC_BASE_URL`, every Bedrock/Vertex/Foundry/Mantle variable,
`CLAUDE_CODE_USE_BEDROCK`, `CLAUDE_CODE_SUBAGENT_MODEL`, `CLAUDE_CODE_EFFORT_LEVEL`,
and the whole `ANTHROPIC_DEFAULT_*_MODEL` family.

`sanitized_environment()` (`:181-209`) is an **allowlist**, not a denylist. The
subprocess receives only:
- POSIX: `PATH`, `LANG`, `LC_ALL`, `LC_CTYPE`, `HOME`, `TMPDIR`, plus `USER`/`LOGNAME`
  **recomputed** from `pwd.getpwuid(os.getuid())` (`:165-178`) rather than inherited
- Windows: `PATH`, `LANG`, `LC_*`, `SystemRoot`, `ComSpec`, `PATHEXT`, `TEMP`, `TMP`,
  `USERPROFILE` (case-folded lookup, `:193-198`)
- plus injected `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1` (`:208`)

**Billing outcome: two accounts, one run.**
- Root orchestrator + Executor + Designer -> the ChatGPT/OpenAI login (untouched;
  `SKILL.md:166-170`: Codex stays signed in with ChatGPT, never writes top-level
  `model` or `model_provider`).
- Planner and/or Advisor on Fable/Opus -> the **Claude Pro/Max/Team subscription
  allowance**, consumed through the CLI exactly as if the user had run `claude`.
- `providers-and-models.md:337` names it: *"Other-provider usage: separate billing or
  allowance."* `README:112`: "You do not need to add an Anthropic API key to Codex."

The bridge deliberately returns **no account identifier** (`fable_advisor_mcp.py:486`;
`SKILL.md:469` "do not expose or restate Claude account-plan metadata"). The plugin
knows *that* a Pro/Max/Team seat paid, never *which*.

### Enablement path

All three MCP launchers ship disabled. Setup flips exactly one plugin-scoped `enabled`
override for the variant whose Python launcher exists (`FABLE_SERVERS`
`configure_native_routing.py:56-60`; `routing_state.FABLE_SERVERS:20-26`). The roster
validator asserts the enabled set is **exactly** the launcher named by the selected seat
(`routing_state.py:344-349`) and that no launcher is enabled without a Claude seat
(`:350-354`). `disable` restores the prior override values.

### The other cross-provider lane (native, OpenAI harness)

For non-subscription providers (OpenRouter / Kimi K3) the mechanism is entirely
different - a **sealed `codex exec`**, i.e. Codex calling itself with a throwaway home.

`invoke_role` (`external_configurator.py:864-953`):
- absolute `--codex-bin` required; PATH lookup forbidden (`:900`)
- binary fingerprinted, then **re-fingerprinted immediately before launch** (`:927-931`)
- registry digest re-checked mid-flight (`:932-936`)
- temp `CODEX_HOME` (`:913-915`) with a generated `config.toml` (`:919-923`, built by
  `_gate0_config:506-527`) pinning `model` / `model_provider` / `model_reasoning_effort`
- argv: `exec --ephemeral --skip-git-repo-check --sandbox read-only --ignore-rules
  --output-last-message <path>` plus one `--disable <feature>` per advertised feature
  (`:937-944`) - disabling `multi_agent`, `multi_agent_v2`, `apps`, `browser_use`,
  `computer_use`, `shell_tool`, `unified_exec`, `skill_search`, ... (`:49-60`)
- prompt = role instruction + packet wrapped in `<sealed_external_role_instruction>` /
  `<bounded_task_packet>` tags (`:906-912`); stdin only; 1 MiB in / 2 MiB out (`:45-47`);
  180 s (`:47`)
- provider stdout/stderr are `DEVNULL` (`_run_invoke_process:777-778`); the **only**
  channel out is the bounded last-message artifact (`:952`)
- the credential never enters argv, env, config, packet or logs - the temp config
  carries only a command-backed `auth` reference to the OS-credential helper
  (`_gate0_config:518-522`)

---

## The role model

### Definition

Four built-in seats: **planner, advisor, designer, executor** (`README:7-12`).
Only `executor` is required (`SKILL.md:74`). Omission semantics are explicit: omitted
planner means the root plans; omitted advisor means `advisor: none`; omitted designer
means `designer: none` (`SKILL.md:74`). Beyond the four, arbitrary user roles exist as
native Codex custom-agent TOML files in `.codex/agents/` (project) or `~/.codex/agents/`
(personal) (`SKILL.md:312-336`).

### Data shape - the persisted roster

`~/.codex/.codex-orchestration-routing.json`, validated by
`routing_state.validate_routing_state` (`routing_state.py:232-357`).

Top level (`:32-45`, `:252-257`):

```jsonc
{
  "schema": 5, "policy_version": 5,          // locked 1:1 (:28, :242-250)
  "managed_by": "codex-orchestration",
  "config_file": "<abs path to config.toml>",
  "planner":  <route|null>,   // key exists only at schema >= 3
  "advisor":  <route|null>,
  "designer": <route|null>,   // key exists only at schema >= 4
  "executor": <route>,        // required
  "managed":  {"mode","usage","metadata","namespace"[,"mcp"]},
  "previous": {"mode","usage","metadata","namespace"[,"mcp"]},
  "scalar_origin": null|bool,
  "managed_feature": null|{...}
}
```

Four route kinds (`_validate_route:94-164`) - **exact key sets; unknown keys rejected**:

| kind | shape | constraint |
|---|---|---|
| `model` | `{kind, model, effort}` | model regex `:29`; **`claude-fable-5` / `claude-opus-5` forbidden here** (`:108-111`) |
| `agent` | `{kind, agent}` | name regex `^[a-z][a-z0-9_]{0,62}$` (`:30`) |
| `fable` | `{kind, model, effort, server}` | seat in {planner,advisor}, schema >= 2, model pinned `claude-fable-5`, effort in 5-set, server in `FABLE_SERVERS` (`:126-143`) |
| `claude_subscription` | `{kind, model, effort, server}` | seat in {planner,advisor}, **schema >= 5**, model pinned `claude-opus-5` (`:144-161`) |

Structural invariants worth lifting verbatim:
- **Planner != Advisor** - same model id, same agent name, *or two Claude subscription
  seats of any kind* all fail (`_validate_route_separation:167-182`).
- **At most one Claude subscription seat total** across Fable+Opus (`:314-323`).
- **Designer must be a direct `model` route** - no MCP seat, no persistent agent name
  (`:275-279`). Stated reason: Codex exposes no scope-qualified agent identity, so a
  later project agent could shadow a persisted name (`SKILL.md:140-142`).
- Managed hint strings must carry `[codex-orchestration managed-policy v1]` as their
  literal first line (`_has_marker_first_line:59-63`).

### Binding + selection at dispatch - static, and prompt-mediated

The roster is not read at dispatch time by any dispatcher. `build_policy`
(`configure_native_routing.py:1123-1281`) **renders it into two prose strings** written
into the Codex user config:

- `features.multi_agent_v2.multi_agent_mode_hint_text` (`:1194-1214`) - behaviour +
  boundaries, delivered to root *and* child tasks
- `features.multi_agent_v2.usage_hint_text` (`:1264-1280`) - the literal routes,
  appended to the spawn tool description

Route rendering is `_spawn_route` (`:1114-1120`):

```python
if route["kind"] == "agent":  return f'agent_type = {json.dumps(route["agent"])}'
return (f'model = {json.dumps(route["model"])}, '
        f'reasoning_effort = {json.dumps(route["effort"])}')
```

producing lines such as `planner -> model="gpt-5.6-sol", reasoning_effort="high",
fork_turns="none"` (`providers-and-models.md:71-75`). For a Claude seat the hint instead
names the MCP server and tool (`:1219-1225` planner, `:1240-1246` advisor).

Only two further config fields are managed: `hide_spawn_agent_metadata = false` and
`tool_namespace = "agents"` (`SKILL.md:386-389`). All writes go through Codex App Server
`config/read` + `config/batchWrite(expectedVersion=...)` compare-and-swap, never a
home-grown TOML rewrite (`providers-and-models.md:139-149`).

**Consequence for Arkestra.** Role-to-model binding is *declared* in validated JSON and
*executed* by instructing the root model. The only mechanically enforced binding is on
the Claude bridge, where the seat is re-read from disk on **every** call and the tool
caller cannot pass a model or effort argument at all: the tool input schemas
(`fable_advisor_mcp.py:766-802`) accept only text fields, and `SKILL.md:477` states
"the root cannot replace them through tool arguments."

Every seat is also revalidated per call against the same full validator used by
status/repair/disable, plus a Codex-home ownership check that the saved `config_file`
resolves to *this* home (`_read_routing_state:296-306`), and a hard refusal of symlinks,
non-regular files and multi-hard-link state files (`:280-284`).

---

## Coordination + fallback behaviour

### The loop

The root Codex model owns everything (`SKILL.md:553-572`). Bounded Advisor approval loop
(`SKILL.md:607-619`, mirrored into generated policy `configure_native_routing.py:1205-1207`):

1. Root numbers the canonical plan version, sends it to a fresh, stateless Advisor call.
2. Require first-line signal `PLAN_APPROVED` or `PLAN_REVISE`.
3. `PLAN_APPROVED` makes that exact version approved - **stop reviewing immediately**.
4. `PLAN_REVISE` - assign stable IDs to material findings; send canonical current
   version + latest critique + compact cumulative ledger to the **same Planner route**.
5. Require `PLAN_REVISION` + complete `FINDINGS_LEDGER` + `REVISED_PLAN`; every finding
   `INCORPORATED` or `REJECTED` with a concrete reason. Reject stale source versions,
   missing or duplicated findings, empty rationales.
6. Increment version, fresh Advisor call, asking it to confirm or contest prior
   dispositions rather than repeat accepted findings.
7. **Never exceed eight total Advisor reviews** (`ADVISOR_REVIEW_LIMIT = 8`,
   `configure_native_routing.py:46`).

Context discipline: only original constraints, current plan and compact ledger cross
between calls - never full transcripts (`SKILL.md:617`).

Round-8 `PLAN_REVISE` **halts before Executor** and emits a non-approval artifact with
plan, version, full ledger, unresolved findings and user choices. "Never label it
approved." (`SKILL.md:619`; policy text `:1207`.)

### Machine-checked pieces of the loop

Most of the loop is prose, but three checks are real code in the bridge:

- **Review decision** - `--json-schema` forces
  `{signal in {PLAN_APPROVED, PLAN_REVISE}, body: non-empty}` (`PLAN_REVIEW_SCHEMA:56-67`),
  then it is **re-validated locally** (`_validate_review_output:445-461`). If both
  `structured_output` and a legacy JSON `result` are present and disagree, that is an
  error (`_review_response:498-501`). Raw prose is never a decision.
- **Revision structure** - `_validate_revision_structure:637-661` requires exactly one
  `## FINDINGS_LEDGER`, exactly one `## REVISED_PLAN`, ledger strictly before plan,
  both sections non-empty.
- **Signal gate** - `:596-604` rejects any response whose first non-empty line is not in
  that seat's allowed signal set.

### Retry, fallback, downgrade - the answer

**There is no retry and no fallback anywhere in the execution path.**

- `_invoke_fable` runs one subprocess. Timeout, nonzero exit, malformed JSON, unexpected
  payload shape, or failed model authorization each raise `AdvisorError` (`:565-604`),
  surfaced as an MCP `isError` result (`:875-883`). No second attempt, no alternate
  model, no alternate launcher.
- The external `invoke` path documents the same: *"It never truncates, retries, falls
  back, mutates lifecycle state, or exposes provider stdout/stderr."*
  (`external-models.md:190`).
- Gate 0 failure - including a provider `429` - is a **failed probe that must not be
  retried without renewed billing approval** (`external-models.md:266`).
- The readiness graph has terminal blockers: `CLI_CHANGED`, `CONFIG_DRIFT`,
  `ROLE_COLLISION`, `RECOVERY_REQUIRED`, `UNSUPPORTED`
  (`external_readiness.py:33-41`), and `transition:178-187` raises on any illegal edge.

**Does it ever silently substitute one model for another?** Two answers.

*Policy: no, emphatically.* "Never silently substitute the root model when an exact child
route is unavailable" is written into the shipped config text
(`configure_native_routing.py:1277`) and into the skill must-never list (`SKILL.md:570`).
Seat labels are declared authoritative: "Codex must never move a model to a different
role" (`README:126`); "never reinterpret a supplied `planner:` model as an Advisor"
(`SKILL.md:72`); an unavailable route is reported, never silently downgraded
(`SKILL.md:601`). Replacing Fable with Opus, or moving Opus between seats, **fails before
any write** and demands a full `disable` plus one fresh complete setup, expressly "to
prevent silent subscription route replacement" (`README:256-261`; `SKILL.md:440`).

*Implementation: one narrow, disclosed exception.* The Fable route accepts a runtime
primary of `claude-opus-4-8` and an allowlisted helper `claude-haiku-4-5-20251001` while
still reporting `"model": "claude-fable-5"`. See **D1/D2** under What NOT to copy.

### Degradation (only on explicit per-task instruction)

A configured Planner or Advisor is **required by default**; route failure, malformed
output, missing context, stale version or invalid ledger halts before Executor
(`SKILL.md:621`). Only an explicit current-task best-effort instruction permits:
- Planner failure -> root assumes Planner duties **without resetting the eight-review
  budget** (`:623`)
- Advisor failure -> end the loop, label the latest validated plan `NOT_ADVISOR_APPROVED`
  before any continuation (`:624`)

The best-effort flag is **not persisted** (`:626`). Designer failure blocks only work
that explicitly requires the handoff (`:601`). Executor unavailability may leave work
with the root only if the user did not require delegation (`:601`).

### Truthfulness vocabulary (directly liftable)

Nine states, deliberately separated so "configured" is never reported as "ran"
(`SKILL.md:592-599`; `providers-and-models.md:318-326`):
`native policy installed` / `policy effective` / `pinned custom agent available` /
`route accepted` / `unverified prompt preference` / `used and confirmed` /
`inherited root - requested child model was not used` / `unavailable` / `none` or `root`.

`used and confirmed` is reachable **only** from mechanical evidence:
`MECHANICAL_IDENTITY_SOURCES = {app_server_event, provider_response_metadata,
rollout_metadata, subscription_cli_runtime}` (`external_readiness.py:159-166`).
`runtime_identity_state:190-201` raises if the evidence source is non-mechanical, and
refuses any identity claim before route acceptance. *"Child prose claiming a model name
is not proof."* (`SKILL.md:596`.)

---

## Config / roster schema

### Where the roster lives

| Layer | Location | Validator |
|---|---|---|
| Seat roster | `~/.codex/.codex-orchestration-routing.json` | `routing_state.py:232` |
| Rendered policy | `~/.codex/config.toml` -> `features.multi_agent_v2.*` (4 fields) | App Server schema |
| Provider catalogue (bundled, read-only) | `skills/codex-orchestration/providers/*.json` | `external_providers.py:72` |
| External runtime state | `~/.codex/.codex-orchestration-external-models.json` | `external_registry.py:183` |
| Recovery journal | `~/.codex/.codex-orchestration-external-transaction.json` | `external_registry.py:21` |
| Per-effort agent files | `~/.codex/agents/*.toml` | sha256-pinned in the registry |

### Provider manifest schema (`external_providers.validate_provider:72-144`)

Exact 13-key top level (`_TOP_KEYS:19-35`); unknown keys rejected.

```jsonc
{
  "schema": 1,                  // must equal SCHEMA (:74)
  "id": "openrouter",           // ^[a-z][a-z0-9_-]{0,62}$ ; must equal filename (:76-79)
  "version": 2,                 // int > 0
  "name": "OpenRouter",
  "lane": "native" | "subscription",                     // :82
  "experimental": false,
  "qualified": false,           // maintainer-review flag; NOT permission to call
  "base_url": "https://...",    // native: HTTPS only, no creds/query/fragment (:59-69)
                                // subscription: MUST be null (:61)
  "wire_api": "responses",      // native: must be "responses" (:88); subscription: null
  "auth": "secure_store",       // native: secure_store|user_helper|none
                                // subscription: must be "first_party_cli" (:95)
  "models": { "<exact-id>": {
      "default_effort": "max",             // must be a member of supported_efforts (:128)
      "supported_efforts": ["max"],        // non-empty, unique, regex-checked (:126-127)
      "context_window": 1048576,           // null or int > 0
      "auto_compact_token_limit": 950000,  // null or int > 0, MUST be < window (:136-140)
      "capability_source": "https://... reviewed 2026-07-18"  // required EVIDENCE (:140)
  }},
  "runtime_identity": "conditional" | "cli_metadata",    // :119
  "subscription_adapter": null | {                       // native: must be null (:90-93)
      "module": "fable_advisor_mcp",                                        // exact (:102)
      "allowed_seats": ["planner","advisor"],                               // exact (:106)
      "allowed_operations": ["create_plan","revise_plan","review_plan"],    // exact (:110)
      "trust_strategy": "first_party_auth_and_runtime_metadata"             // exact (:115)
  }
}
```

Three manifests ship: `providers/claude-fable.json:1-41` and `providers/claude-opus.json:1-41`
(subscription lane, identical apart from id/name/model), and `providers/openrouter.json:1-25`
(native lane, one model `moonshotai/kimi-k3`, `supported_efforts: ["max"]` only).

Loading is path-hardened: ID regex, resolve inside `providers/`, reject path escape,
reject symlink (`load_provider:147-157`).

### Adding a new model - the actual procedure

Native lane (`external-models.md:233-246`) requires **all** of: a manifest in
`providers/` with HTTPS base URL, `wire_api = responses`, exact model IDs, exact effort
allowlists, an evidence source and initial qualification state; an auth strategy using OS
secure storage or a separately pinned absolute helper; an **isolated Gate 0 test for
every newly qualified model/effort tuple**; malformed-schema, collision, auth-failure,
drift, rollback, redaction and route-identity tests; documentation of provider
retention/privacy terms and of the route-acceptance-versus-runtime-identity distinction;
a plugin version bump and a fresh final-tree security review.

Subscription lane additionally (`:248-252`): an official first-party CLI, audited
login-status semantics, a fixed no-tools/no-persistence invocation, a sealed operation
allowlist, mechanical runtime model metadata, CLI re-attestation behaviour and dedicated
redaction tests - closing with *"Do not generalize Fable's adapter into arbitrary CLI
execution."*

**Two-level qualification is the shape worth stealing.** `qualified` in the manifest
means *reviewed by the maintainer*; it does **not** make the route callable. Every
installation starts unqualified and must pass its own **Gate 0** - one explicitly
billable, ephemeral, read-only probe of the exact provider/model/effort tuple
(`run_gate0:956-1060`), guarded by `_require(acknowledge_billing, ...)` at `:967` before
anything runs, with the CLI control contract verified *before* the billable command
(`_verify_gate0_cli_contract:536-577`, including a check that `--sandbox` documents
`read-only` at `:570-573`). Success sets `qualified: true`, `capability_checked_at`, and
`capability_source = "isolated-codex-exec-route-acceptance"` (`:1052-1057`), and is
explicitly **route acceptance, not runtime model confirmation** (`SKILL.md:284-285`).

### Registry schema (`external_registry.py`)

Top level `{schema, managed_by, codex_home, providers, roles, cli_trust}` (`:27-29`).

Role record (`_ROLE_KEYS:46-60`, validated `:136-170`):
`purpose / provider / model / default_effort / supported_efforts / effort_source /
agent_name / agent_file / agent_sha256 / effort_agents{effort -> {name,file,sha256}} / state`

with cross-checks: `effort_agents` keys must equal `supported_efforts` exactly
(`:151-154`); the default-effort agent must match `agent_name`, `agent_file` and
`agent_sha256` (`:166-169`); agent names must not collide across roles (`:202-207`);
owned config keys must be prefixed `model_providers.<id>.` (`:131`).

Secret hygiene is structural rather than conventional: `_validate_nonsecret_tree:89-101`
walks the entire tree and rejects **any key** containing `api_key`, `authorization`,
`bearer`, `credential`, `password`, `secret` or `token` (`_FORBIDDEN_KEY_PARTS:65-73`),
and rejects any value type outside `str|int|bool|None`.

Writes are atomic compare-and-swap: `write_registry:268-305` validates, requires a
caller-supplied `expected_sha256` when a file already exists (`:280-284`), stages an
`O_EXCL|O_NOFOLLOW` temp file at 0600, fsyncs, then **re-verifies the digest a second
time immediately before `os.replace`** (`:298-300`), then fsyncs the directory.

---

## Sub-agents + Advisor

"Adds four simple roles" (`README:7`) = **Planner, Advisor, Designer, Executor**.

| Seat | Required | Job | Cross-provider? | Bridge ops |
|---|---|---|---|---|
| **Planner** | no (omit -> root plans) | drafts the plan; revises after critique | yes - Fable/Opus | `create_plan`, `revise_plan` |
| **Advisor** | no (omit -> no review) | reviews, finds material gaps, approves | yes - Fable/Opus | `review_plan` |
| **Designer** | no | bounded visual / UX / interaction / IA / design-system handoff | only as a **task-local** External Model role | - |
| **Executor** | **yes** | implements the approved plan | no - inherits the root provider | - |

Topology (`SKILL.md:559-570`; policy text `:1213`): Planner, Advisor and Designer are
**root-directed and mutually isolated** - they cannot contact one another, cannot contact
Executors, cannot spawn descendants, cannot edit files, cannot release Executor work.
Designer may edit *only* explicitly delegated design artifacts. An Executor never
redesigns the plan or contacts the other seats.

Seat-to-operation binding is enforced in two places. `external_subscription.py:20-24`:

```python
OPERATION_SEATS = {"create_plan": "planner", "revise_plan": "planner",
                   "review_plan": "advisor"}
```

checked against the manifest `allowed_seats` / `allowed_operations` in
`validate_route:36-61`. And in the bridge itself, where each entry point hardcodes its
seat: `create_plan(... seat="planner")` (`fable_advisor_mcp.py:626`),
`revise_plan(... seat="planner")` (`:685`), `review_plan(... seat="advisor")` (`:702`).
`SKILL.md:630` states it plainly: "never send a supplied Planner route to `review_plan`."

Each of the three system prompts is a separate constant with its own required output
contract - `ADVISOR_SYSTEM_PROMPT:126-129`, `PLANNER_CREATE_SYSTEM_PROMPT:131-134`,
`PLANNER_REVISE_SYSTEM_PROMPT:136-148` - and each forbids editing, tool calls, spawning,
contacting the other seat, and implementation.

### The Advisor review limit

`ADVISOR_REVIEW_LIMIT = 8` at `configure_native_routing.py:46`. It is rendered into the
shipped policy prose by index into a number-word tuple (`:1129-1139`), so the text reads
"rounds two through eight" and "a round-eight PLAN_REVISE halts before Executor"
(`:1205`, `:1207`).

Raised from five to eight in the tip commit `2c0a4b8` / `CHANGELOG.md:3-7`: "Raise the
bounded Advisor approval loop from five to eight reviews while preserving immediate
approval exit and fail-closed plan, ledger, and round-limit handling before Executor
work."

Guarded by three tests: `tests/test_native_routing.py:455` asserts the value is 8;
`:511` patches it to 7 to prove the prose is generated from the constant rather than
hardcoded; `tests/test_skill_contract.py:379` asserts the constant is **defined exactly
once** in the script. That third test is what makes the single-source-of-truth real.

---

## Effort mapping

### There is no cross-provider effort mapping. That is the design.

Every provider declares its own allowlist in its manifest, and resolution is strictly
per-provider (`external_providers.resolve_effort:165-176`):

```python
effort = model["default_effort"] if requested == "auto" else requested
if effort not in model["supported_efforts"]:
    raise ProviderError(f"effort {effort!r} is unsupported for {model_id!r}; supported: ...")
```

`auto` resolves to *that model's* declared default. Anything else is **rejected - never
clamped, never aliased, never downgraded**. Stated three separate times:
`SKILL.md:207`, `SKILL.md:288-289`, `external-models.md:259-261`.

### Per-provider ladders as shipped

| Provider / model | Ladder | Default | Alias | Source of the ladder |
|---|---|---|---|---|
| Claude Fable 5 | low, medium, high, xhigh, max | `high` | `ultra` -> `max` | `claude-fable.json:13-25`; `configure_native_routing.py:51-52` |
| Claude Opus 5 | low, medium, high, xhigh, max | `high` | **none** | `claude-opus.json:13-25`; `:309-319` |
| OpenRouter Kimi K3 | **max only** | `max` | `auto` -> `max` | `openrouter.json:14-17` |
| Codex GPT seats | host catalog values (`Extra High` -> `xhigh`) | host default | - | `SKILL.md:133` |

The `ultra` alias exists only because "Claude Code does not expose a separate Ultra
effort" (`README:106`). It is normalized at setup (`normalize_fable_effort:296-306`), the
**effective** value is persisted, and the mapping is disclosed in setup output
(`SKILL.md:479`). Opus rejects it outright (`normalize_opus_effort:309-319`;
`SKILL.md:482`).

### The two efforts never meet

- Codex side: the token is emitted as `reasoning_effort = "<effort>"` into the spawn hint
  (`_spawn_route:1114-1120`).
- Anthropic side: the token is emitted as `--effort <effort>` on the Claude argv
  (`fable_advisor_mcp.py:530-531`).

They share a vocabulary (`low/medium/high/xhigh/max`) but there is **no translation
table, no clamp and no normalization across the boundary**. Each side validates the
literal string against its own provider's allowlist. A Codex-side effort is never
consulted when choosing a Claude effort or vice versa.

Effort is a property of the **seat**, fixed at setup. The MCP caller cannot influence it:
the tool schemas expose only text fields (`:766-802`) and `_invoke_fable` reads the
effort from disk (`:517`, `:530-531`). `providers-and-models.md:262` puts it directly:
"The bridge reads only the normalized saved value, so tool callers cannot raise the
effort at review time."

### Effort is verified against the installed CLI

`verify_claude_prerequisites` (`configure_native_routing.py:936-1046`), before persisting:

1. `claude --version` (Opus only) -> `_parse_claude_version:916-933`, which **raises** on
   an unparseable string (fails closed); Opus requires >= `(2,1,219)` (`:54`, `:988-999`).
2. `claude --help` -> scrape advertised long flags by regex (`:1012-1017`) and require all
   eleven transport-critical flags (`:1000-1011`), else "Claude Code is too old".
3. Scrape the advertised effort list with `r"--effort\s+<level>.*?\((low[^)]*)\)"`
   (`:1025-1032`) and require the selected effort to appear (`:1035-1039`).

Extra values the CLI advertises **do not** expand the sealed set (`SKILL.md:483-484`).
Setup and status make **no model call** at any point (`SKILL.md:363`).

**For Arkestra:** this repo is working evidence that the answer to cross-provider effort
is *not* a mapping matrix. It is a per-provider allowlist, a single `auto` sentinel that
resolves locally against that provider's own default, and a capability probe against the
installed client. A request carrying a level the target provider does not publish is an
error, not a rounding.

---

## What NOT to copy

**D1 - The headline `model` field reports the configured route, not the observed
runtime.** `_base_result` (`fable_advisor_mcp.py:608-618`) returns `"model": route["model"]`
- the *pinned* id - while `REVIEWED_PRIMARY_MODELS_BY_ROUTE` (`:37-42`) permits the Fable
route to be satisfied by a runtime primary of **`claude-opus-4-8`**. A caller can
therefore receive `{"model": "claude-fable-5", "used_models": ["claude-opus-4-8", ...]}`.
The truth is present but demoted to a secondary field.
`external_subscription.invoke:137-140` then asserts `result["model"] == model`, which
compares the pinned label to itself and cannot detect the divergence. The code comments
the intent (`:611-613`) and the docs disclose it (`providers-and-models.md:241-243`;
`SKILL.md:488-491`) - but a consumer reading the obvious field is misinformed.
**Arkestra: put the OBSERVED identity in the primary field and the REQUESTED identity in
the secondary field, never the reverse.**

**D2 - A second, cheaper model participates in a call the user configured as one model.**
`FABLE_HELPER_MODEL = "claude-haiku-4-5-20251001"` (`:35`) is allowlisted into
`ALLOWED_RUNTIME_MODELS` (`:43-45`) for the Fable route. A Fable Planner call may
legitimately run Haiku for part of the work, surfaced only inside `used_models`. This is
upstream CLI behaviour being accommodated, not invented - but a governance layer must
make a permit/deny decision **on the helper**, not merely record it after the fact.

**D3 - Asymmetric strictness between two seats of the same lane, encoded in module
constants.** Fable permits two primaries plus one helper; Opus permits exactly one model
and fails closed on anything extra (`ALLOWED_RUNTIME_MODELS_BY_PRIMARY:46-51`). The
asymmetry is reasoned in comments (`:47-49`: "No Opus helper identity has been
independently verified") and is the safer default - but it lives in Python constants, not
in the manifests that otherwise define every model property. Adding a fourth sealed model
requires editing `fable_advisor_mcp.py`, so the manifest is **not** the extension point it
appears to be. **prism-model-onboard: put the runtime-identity allowlist in the manifest,
next to `supported_efforts`, so onboarding is data rather than code.**

**D4 - Identity rotation is a release event.** Because the allowlists are literal
constants, an upstream model-id rotation makes every configured seat fail closed until a
new plugin version ships. The repo accepts this deliberately
(`providers-and-models.md:246-247`: "Identity rotation therefore requires a reviewed
plugin update rather than a wildcard"). Safe, but it is an availability cliff with no
operator-side override - worth a conscious decision rather than inheritance.

**D5 - The entire coordination contract is prompt text in a config field.** The
eight-review limit, seat isolation, the never-silently-substitute rule, runtime
Planner/Advisor independence, and the root-only caller boundary are all prose inside
`multi_agent_mode_hint_text` / `usage_hint_text` (`build_policy:1194-1280`). The repo says
so itself, twice and without euphemism: *"Current MCP calls do not identify their caller,
so this caller boundary is instruction-enforced"* (`README:275`) and *"Never describe the
caller boundary as engine-enforced"* (`SKILL.md:502`). The honesty is exemplary; the
enforcement is not there. This is precisely the soft-fix class - copy the structure and
the honesty, back the invariants with checks.

**D6 - `--permission-mode dontAsk` is safe only in combination.**
`fable_advisor_mcp.py:534-535` suppresses every permission prompt; it is survivable
*only* because `--tools ""` (`:532-533`), `--safe-mode` (`:531`) and
`--no-session-persistence` (`:536`) sit on the same argv. Those four flags are one unit.
Lifting `dontAsk` without the other three hands an unattended subprocess unprompted tool
access.

**D7 - The system prompt travels on argv, not stdin.** `:540-541` passes the full role
prompt as a command-line argument, visible to any process listing on the host. Only the
user packet goes on stdin (`:557`). Not a credential exposure, but the wrong channel if a
prompt ever carries task-sensitive text.

**D8 - The Windows environment allowlist keeps only `USERPROFILE`.**
`sanitized_environment:183-198` preserves `USERPROFILE` but not `APPDATA` /
`LOCALAPPDATA`. Documented as intentional (`README:207-213`) and correct for Claude Code
discovery today - but it bakes an assumption about another vendor's CLI into a security
boundary, and it will break silently if that changes.

**D9 - Copy-pasted error strings.** `_run_json:238-245` hardcodes "Claude Code
authentication check timed out / could not run / exited with N" even though the helper is
generic JSON-running code. Cosmetic, but it will misattribute a future non-auth failure.

**D10 - Two README metrics have no source anywhere in the repository.** See the metric
table below.

**D11 - Terms-of-service surface: flagged, not adjudicated.** The mechanism drives a
first-party *subscription* login headlessly as a component of a different vendor's
product, consuming the Claude allowance. The repo confines it deliberately - sealed
adapters only, Planner/Advisor only, no tools, no persistence, no key extraction, and an
explicit refusal to generalize (`external-models.md:248-252`; `SKILL.md:306-310`). Before
lifting the pattern, verify it against Anthropic's current usage terms. The code cannot
answer that question and does not claim to.

**Checked and NOT a defect:** the Opus minimum-version gate looked skippable (the guard
at `:990-993` is conditional on `installed_version is not None`), but
`_parse_claude_version:916-933` **raises** `ConfigurationError` on any unparseable
version rather than returning `None`. That path fails closed. Verified, not inferred.

---

## Source of every metric the repo quotes

| Claim | Where | Source | Verdict |
|---|---|---|---|
| **"about 65%"** fewer Codex credits | `SKILL.md:693`; `providers-and-models.md:339-345` | **Derived arithmetic, not measurement.** Published in full: `20% Sol + 80% Luna at 20% of Sol rate = 0.20 + (0.80 x 0.20) = 0.36`, "about 64% fewer credits before orchestration overhead". The input assumption "the published Luna rate of 20% of Sol" traces to the cited OpenAI pricing doc (`providers-and-models.md:352`). | **Sourced and self-auditing.** Formula published, disclaimer explicit (`SKILL.md:695`: never call it fewer raw tokens, a guaranteed limit saving, a fixed monetary saving, or 5x work). Model to copy. |
| **"up to 2x faster on suitable tasks"** | `README:59` | **No source anywhere in the repo.** A grep for `2x` returns this line only. | **Unsourced.** Disclaimed at `README:62` ("targets, not guarantees") but never substantiated. |
| **"hit premium-model limits about 40% less often"** | `README:60` | **No source anywhere in the repo.** A grep for `40%` returns this line only. | **Unsourced.** Same disclaimer, same absence. |
| Capability matrix (v2 metadata, namespace behaviour, fork rules) | `providers-and-models.md:18-33` | "source-checked and runtime-tested on **July 10, 2026**"; the `tool_namespace = "agents"` finding is pinned to live testing on **Codex Desktop `0.144.0-alpha.4`**, where `collaboration.spawn_agent` rejected expanded model/effort metadata while `agents` accepted it and spawned Luna at `xhigh` (`SKILL.md:382`). | **Dated and version-pinned observation.** The claim carries its own expiry. |
| Kimi K3: context `1048576`, Responses endpoint, `max`-only reasoning | `openrouter.json:20`; `external-models.md:256-261`; `README:189-193` | The OpenRouter official model page plus public endpoint metadata, **reviewed 2026-07-18** - URL and date stored *inside the manifest* as `capability_source`. | **Sourced in-band.** The evidence string is schema-required (`external_providers.py:140`). |
| Opus requires Claude Code >= 2.1.219 | `README:109-110`; `configure_native_routing.py:54` | Asserted in docs, **enforced mechanically** at `:988-999`. | Enforced, not merely claimed. |
| Primary sources list | `providers-and-models.md:349-356` | Six links: OpenAI subagents/custom agents, Codex App Server, Codex config reference, Codex pricing; Anthropic "Building effective agents", Anthropic "Multi-agent research system". | Present and specific. |

Pattern worth naming: **every number that is checkable is either checked in code or
carries its date and URL; the two numbers in the marketing section are precisely the two
with no provenance.**

---

## Lift notes for Arkestra + prism-model-onboard

### Directly liftable into Arkestra (the Governor)

1. **Fail-closed exact-shape state validation.** `routing_state.validate_routing_state`
   (`:232-357`) rejects unknown keys, requires `set(value) == expected_top` (`:257`),
   pairs `schema` to `policy_version` 1:1, and refuses future extensions **by design**
   (`:235-237`). Arkestra should reject a provider key it does not recognize rather than
   ignore it - that *is* the unmapped-provider-fails-closed rule, expressed as a schema
   instead of a runtime branch.

2. **Route separation as a validator, not a convention.**
   `_validate_route_separation:167-182` turns "Planner and Advisor must be independent"
   into a computable predicate that fires before any write, covering three collision
   shapes including *two subscription seats of different kinds*. Arkestra's "a request
   never crosses providers implicitly" wants exactly this treatment.

3. **Two-level qualification: reviewed != callable.** Manifest `qualified` means the
   maintainer reviewed it. Per-installation **Gate 0** means this machine's exact
   provider/model/effort tuple accepted one real request - billing acknowledged
   separately and immediately before the probe (`external_configurator.py:967`), CLI
   contract verified *before* spend (`:983-987`), success recorded as route acceptance
   and explicitly **not** runtime identity (`SKILL.md:284-285`). The cleanest available
   answer to "how does the Governor know a provider actually works here."

4. **The nine-state honesty vocabulary** (`SKILL.md:592-599`) with `used and confirmed`
   gated on `MECHANICAL_IDENTITY_SOURCES` (`external_readiness.py:159-166`). Arkestra
   needs the same distinction between *permitted*, *dispatched*, *accepted* and
   *confirmed-by-mechanical-evidence*. `runtime_identity_state:190-201` raises rather
   than guessing - a griot_assert-shaped function already written.

5. **Explicit readiness graph with terminal blockers.** Sixteen states, per-state legal
   target sets, `transition()` raising on any illegal edge
   (`external_readiness.py:43-187`), and four states declared non-best-effort
   (`SKILL.md:299-300`). Step-down chains want this shape: legal transitions enumerated,
   never inferred.

6. **Credential-bound requests are structurally unfailoverable here.** Convergent
   evidence for the rule Arkestra just shipped: a Claude seat *cannot* fail over because
   there is nothing to fail over to. The seat pins one model id, the env allowlist strips
   every alternate-endpoint variable (`SENSITIVE_ENV:68-119`), and the auth check demands
   a first-party subscription (`:261-272`). Arkestra reached the conclusion by policy;
   this repo reached it by removing the mechanism.

7. **Effort: per-provider allowlist plus a local `auto` sentinel, no cross-provider
   matrix.** `resolve_effort:165-176`. `auto` means "this model's declared default";
   every other unsupported value is an error. This answers the open Arkestra question in
   the negative - do not build the mapping table. Add the capability probe
   (`configure_native_routing.py:1025-1039`) so the declared ladder is checked against
   the installed client rather than trusted.

8. **Single source of truth enforced by test.** `ADVISOR_REVIEW_LIMIT` defined once
   (`:46`), rendered into prose by index (`:1129-1139`), asserted-defined-once by
   `tests/test_skill_contract.py:379`, and behaviourally re-tested under a patched value
   by `tests/test_native_routing.py:511`. The hard form of "do not hardcode the number
   twice": the convention has a check.

9. **Atomic CAS with a double-verified digest.** `external_registry.write_registry:268-305`
   checks the expected digest, stages `O_EXCL|O_NOFOLLOW` at 0600, then **re-checks the
   digest again immediately before `os.replace`** (`:298-300`). Governor state that two
   sessions may touch wants this.

10. **Structural secret hygiene.** `_validate_nonsecret_tree:89-101` plus
    `_FORBIDDEN_KEY_PARTS:65-73` reject secret-shaped *keys* anywhere in the tree, and
    the value-type allowlist forbids nested surprises. A schema that cannot hold a
    credential beats a rule saying do not put credentials in it.

### Directly liftable into prism-model-onboard

11. **The manifest is the onboarding unit.** One reviewed JSON file per provider carrying
    the effort ladder, the default, the context window, the compaction limit, and a
    **mandatory `capability_source` evidence string with URL and review date**
    (`external_providers.py:140`; example `openrouter.json:20`). Make the evidence string
    required - it is what turns a roster entry into a checkable claim rather than a
    remembered one.

12. **Cross-field consistency baked into the validator**: default must be a member of
    supported; supported must be non-empty and unique;
    `auto_compact_token_limit < context_window` (`:128-140`). Cheap, and it catches the
    copy-paste onboarding error.

13. **Lane discrimination.** `native` (HTTPS + Responses + secure-store auth) versus
    `subscription` (no base URL, no wire API, first-party CLI, sealed adapter with exact
    `allowed_seats` / `allowed_operations` lists), with each lane's *forbidden* fields
    asserted null (`:90-93`, `:94-95`). Onboarding a Claude-subscription model and
    onboarding an API model are different transactions requiring different evidence -
    encode that split from day one.

14. **The onboarding checklist as shipped documentation.** `external-models.md:233-252`
    is a ready-made requirements list for `prism-model-onboard`: manifest, auth strategy,
    per-tuple probe, seven named negative-test classes, retention/privacy documentation,
    version bump, fresh security review. Lift the list; it is better than most.

15. **Per-effort agent variants.** `connect` materializes one provider-pinned agent file
    per manifest-validated effort, each sha256-recorded, with the default-effort variant
    cross-checked against the role's top-level fields (`external_registry.py:150-169`).
    Effort becomes a *routable identity* rather than a call-time parameter - relevant if
    Arkestra ever needs to permit `high` while denying `max` on the same model.

16. **Preview-then-apply on every mutating verb.** `prepare`, `connect`, `ready`,
    `disconnect`, `remove-provider`, `trust-helper`, `--repair`, `--disable` are all
    dry-run first and apply only after the preview is inspected
    (`external-models.md:68-81`, `:204-215`; `SKILL.md:412-427`). Matches the Arkestra
    ask/allow/deny gate shape directly.

### Deliberately not lifted

- The prompt-as-control-plane approach (**D5**). Copy the vocabulary, the state machine
  and the honesty; give the invariants real checks.
- Runtime-identity allowlists as module constants (**D3**, **D4**) - move to manifest.
- `"model"` reporting the pinned rather than the observed id (**D1**) - invert it.

### One-line characterization

Codex-Orchestration is a **governance layer without an enforcement engine**: the schemas,
state machine, qualification gates and refusal semantics are rigorous and mechanically
checked, while the orchestration itself is prose handed to a model that is trusted to
comply - and the repo says so, in its own words, rather than pretending otherwise.
