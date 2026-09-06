---
date: 2026-09-06
topic: cc-conversation-archiver — Claude Code capture-half plugin (analysis)
subject_repo: C:\Users\digit\GriotSandbox\xplatform-harvest\cc-conversation-archiver
subject_commit: 078d1fb "release conversation-archiver v0.11.0"
purpose: (A) pattern to lift for sankofa + chat-log-access capture half; (B) plugin-structure reference
mode: documentarian — describes what exists
---

# cc-conversation-archiver

All paths below are relative to
`C:\Users\digit\GriotSandbox\xplatform-harvest\cc-conversation-archiver`.
Line numbers are from the checked-out tree at commit `078d1fb`.

## Overview

A Claude Code plugin (`conversation-archiver`, v0.11.0 per
`plugins/conversation-archiver/.claude-plugin/plugin.json:3`) that writes every
conversation turn into a git repository as **one markdown file per session**,
partitioned into `YYYY-MM/` month folders. It is a hook-driven capture system:
five Claude Code hook events invoke a single stdlib-only Python script
(`plugins/conversation-archiver/scripts/archive.py`, 2124 lines) which reads the
hook payload from stdin, parses the session transcript JSONL, accumulates
turns into a per-session state file under `~/.claude/cc-conversation-archiver/state/`,
re-renders the markdown from that state, and (in `auto` mode) commits and
pushes in a detached background process.

Repository inventory (19 files, `.git/` excluded):

| Path | Role |
|---|---|
| `.claude-plugin/marketplace.json` | marketplace manifest (repo root) |
| `plugins/conversation-archiver/.claude-plugin/plugin.json` | plugin manifest |
| `plugins/conversation-archiver/hooks/hooks.json` | hook registration (73 lines) |
| `plugins/conversation-archiver/hooks/check_deps.sh` | SessionStart dependency check (33 lines) |
| `plugins/conversation-archiver/scripts/archive.py` | the whole archiver + CLI sub-modes (2124 lines) |
| `plugins/conversation-archiver/scripts/report_title.py` | fast-path title reporter (352 lines) |
| `plugins/conversation-archiver/scripts/title_watch.py` | per-session title watcher daemon (215 lines) |
| `plugins/conversation-archiver/scripts/notify.py` | tool-agnostic OSC 9999 notifier (210 lines) |
| `plugins/conversation-archiver/commands/*.md` | 8 slash commands |
| `README.md` (304), `RELEASING.md` (64), `plugins/conversation-archiver/README.md` (296) | docs |

There is **no `skills/` directory** and no `agents/` directory in this plugin —
the entire surface is hooks + commands + scripts.

Persistent state lives outside the repo, under `~/.claude/cc-conversation-archiver/`
(`scripts/archive.py:51`):

| File | Line defining it | Contents |
|---|---|---|
| `config.json` | `archive.py:52` | `{mode, repo, subdir}` |
| `state/<session_id>.json` | `archive.py:53`, `archive.py:605-606` | accumulated blocks, keys, title, start, machine |
| `state/_index.json` | `archive.py:54` | relpath -> session_id (filename collision guard) |
| `archive.log` | `archive.py:55` | per-run log |
| `push.log` | `archive.py:56` | background push output |
| `push.lock`, `archive.lock` | `archive.py:57-58` | fcntl advisory locks |
| `git-credentials` | `archive.py:68` | Second Brain push credential, chmod 600 |
| `plugin_root` | `hooks/check_deps.sh:14-17` | plugin root path, so commands can find `archive.py` |
| `state/<sid>.title`, `.watch`, `.tty`, `.stalename`, `.clearlabel` | `report_title.py:60,96,110`; `archive.py:349,389` | title-reporting bookkeeping |

---

## Hook wiring

### Which events, in which file

All hooks are declared in **`plugins/conversation-archiver/hooks/hooks.json`**
(a single JSON object with a `description` string at line 2 and a `hooks` object
at lines 3-72). Five events are registered:

| Event | hooks.json lines | Command(s) |
|---|---|---|
| `SessionStart` | 4-17 | `check_deps.sh` (line 9) **and** `report_title.py` (line 13) |
| `PostToolUse` | 18-27 | `report_title.py` (line 23) |
| `Stop` | 28-37 | `archive.py` (line 33) |
| `SubagentStop` | 38-47 | `archive.py` (line 43) |
| `UserPromptSubmit` | 48-61 | `archive.py` (line 53) **and** `report_title.py` (line 57) |
| `SessionEnd` | 62-71 | `archive.py` (line 67) |

### Exact JSON shape

The manifest uses the standard Claude Code hook shape — event name -> array of
matcher groups -> each group has a `hooks` array of `{type, command}` objects.
No `matcher` key is set on any group (so every group matches unconditionally,
including `PostToolUse`, which therefore fires after *every* tool call).
The archive registration (`hooks/hooks.json:28-37`) verbatim:

```json
"Stop": [
  {
    "hooks": [
      {
        "type": "command",
        "command": "command -v python3 >/dev/null 2>&1 && command -v git >/dev/null 2>&1 && python3 \"${CLAUDE_PLUGIN_ROOT}/scripts/archive.py\" || true"
      }
    ]
  }
]
```

Notable properties of the command strings:

- `${CLAUDE_PLUGIN_ROOT}` is the plugin-root variable Claude Code expands
  (`hooks/hooks.json:9,13,23,33,43,53,57,67`).
- Every archive hook is prefixed with a **dependency guard**:
  `command -v python3 && command -v git && … || true`
  (`hooks/hooks.json:33,43,53,67`). Title hooks guard on `python3` only
  (`hooks/hooks.json:13,23,57`).
- `check_deps.sh` is invoked through an explicit `bash "…"`
  (`hooks/hooks.json:9`) rather than relying on the file being executable.
- The `description` field at `hooks/hooks.json:2` is a single ~2,000-character
  paragraph documenting the whole trigger design inside the manifest itself.

### How it runs "after every turn" without blocking a prompt

Four mechanisms stack:

1. **The shell guard.** Each hook command ends in `|| true`
   (`hooks/hooks.json:33` et al.), so a missing `python3`/`git` short-circuits
   the `&&` chain and the hook still exits 0.
2. **The script's top-level guard.** `archive.py`'s entry point wraps `main()`
   in a bare `except Exception` that logs the traceback, then
   `sys.exit(0)  # never disrupt the session` (`scripts/archive.py:2118-2123`).
   `report_title.py` does the same with a silent `except` (`scripts/report_title.py:346-351`),
   as does `title_watch.py` (`scripts/title_watch.py:210-215`).
3. **The push is detached.** In `auto` mode the hook commits synchronously but
   the push is spawned as a separate detached process re-running the same script
   with `--push-only` (`scripts/archive.py:873-884`, `subprocess.Popen(...,
   start_new_session=True, stdout=DEVNULL, stderr=DEVNULL)`), invoked from
   `_archive_locked` at `scripts/archive.py:2114`.
4. **Every blocking call is time-bounded.** `run_git` wraps `subprocess.run` with
   a default `timeout=30` and converts both `FileNotFoundError` and
   `TimeoutExpired` into synthetic non-zero `CompletedProcess` results
   (rc 127 / rc 124) rather than raising (`scripts/archive.py:785-815`). The one
   deliberate wait — the Stop-vs-flush race poll — is capped at 6 iterations of
   0.5s, i.e. ~3s (`scripts/archive.py:1843-1847`).

The Stop-race poll is worth naming precisely: on `Stop`/`SubagentStop` the script
polls `_final_reply_pending(tpath)` (`scripts/archive.py:998-1039`), which returns
True only while the transcript's **last** entry is a thinking-only assistant block
with `stop_reason == "end_turn"` — the documented signal that the visible reply is
about to be written. Every other terminal state returns False and the poll exits
immediately, so tool-ending and text-less turns add zero latency
(`scripts/archive.py:1009-1012` comment).

### Payload contract

`main()` reads stdin and JSON-decodes it (`scripts/archive.py:1808-1809`), then
pulls exactly three fields: `session_id`, `transcript_path`, `hook_event_name`
(`scripts/archive.py:1811-1813`). Missing `session_id` or `transcript_path`, or a
non-existent transcript, is a silent return (`scripts/archive.py:1815-1819`).
`report_title.py` reads the same payload plus `source` and `cwd`
(`scripts/report_title.py:263-265,287,215`).

### Sidechain redirection

A `SubagentStop` payload can point at a subagent transcript. `_is_sidechain_transcript`
(`scripts/archive.py:924-947`) detects that two ways: `"subagents" in tpath.parts`
(line 931), falling back to reading the first entry's `isSidechain` flag
(lines 933-944). When detected, `main` redirects to the main transcript via
`_main_transcript_for(session_id)` (`scripts/archive.py:950-964`), which globs
`<projects>/*/<session_id>.jsonl`; if no main transcript is found the run is
skipped rather than archiving sidechain content (`scripts/archive.py:1827-1833`).

---

## Transcript parsing (what is kept, what is dropped)

### Input path and format

Claude Code transcripts live at `<projects>/<encoded-project>/<session-id>.jsonl`;
the base dir is `~/.claude/projects`, overridable via `CLAUDE_PROJECTS_DIR`
(`scripts/archive.py:916-921`). Subagent transcripts sit one level deeper at
`<projects>/<proj>/<main-sid>/subagents/agent-*.jsonl`
(`scripts/archive.py:927-929` docstring). For hook runs the path arrives in the
payload; for `--backfill` it is discovered by glob.

The file is JSON Lines. `_content_entries` opens it and iterates line by line,
skipping blanks and `json.JSONDecodeError` lines and non-dict entries
(`scripts/archive.py:255-266`).

### The dispatch table

`_content_entries` (`scripts/archive.py:240-283`) is the single place that decides
what counts as content. It yields `(entry, role, text)` where role is
`"user"`, `"assistant"`, or `"compact"`:

| Entry shape | Handling | Lines |
|---|---|---|
| `type: "user"` with `isMeta` truthy | **dropped** (`continue`) | 269-270 |
| `type: "user"` otherwise | `_clean_user_text(message.content)` | 271-273 |
| `type: "attachment"` | `_queued_prompt(entry)` | 274-277 |
| `type: "assistant"` | `_assistant_text(message.content)` | 278-281 |
| `type: "system"` + `subtype == "compact_boundary"` | `_compact_divider(entry)` | 282-283 |
| anything else (incl. `ai-title`, `queue-operation`, `summary`, tool plumbing) | **dropped** — no branch matches | — |

### KEPT

- **Typed user prompts.** `_clean_user_text` (`scripts/archive.py:141-182`) accepts a
  plain-string `content` (lines 149-150) or, for a list content, only the blocks with
  `type == "text"` joined by blank lines (lines 151-157) — this is how a message
  with an attached image still contributes its text.
- **Slash-command invocations**, reconstructed as `"/name args"` from
  `<command-name>` and `<command-args>` tags (`scripts/archive.py:164-179`;
  regexes at `scripts/archive.py:134-135`). The inline comment at lines 170-173
  records that this entry used to be dropped entirely, which erased the opening
  turn of any command-initiated session.
- **Queued (mid-turn) user messages.** `_queued_prompt` (`scripts/archive.py:221-237`)
  handles `type: "attachment"` entries whose `attachment.type == "queued_command"`
  and whose `attachment.origin.kind == "human"`, returning `attachment.prompt`.
  The docstring (lines 222-228) states that a message sent while Claude is working
  is *not* recorded as a `type: "user"` entry at all.
- **Assistant visible text**: `_assistant_text` (`scripts/archive.py:185-195`) keeps
  only `content[]` blocks whose `type == "text"`.
- **Compaction boundaries**, rendered as a one-line blockquote divider carrying
  `compactMetadata.trigger` and `preTokens`/`postTokens`
  (`scripts/archive.py:206-218`). The divider text itself states that Claude Code
  does not persist the compaction summary text to disk (lines 216-218).

### DROPPED — the README claim verified

The README claims "tool calls, tool results, and thinking are excluded"
(`README.md:5-6`, `plugins/conversation-archiver/README.md:3-5`). In code:

- **Thinking blocks and tool_use blocks**: excluded by construction —
  `_assistant_text` filters `b.get("type") == "text"` and nothing else
  (`scripts/archive.py:189-193`). A thinking-only assistant message therefore
  yields `None` (line 195) and is not emitted.
- **Tool results**: a `type: "user"` entry whose content is a list of
  `tool_result` blocks produces an empty `parts` list in `_clean_user_text`
  (lines 151-157) -> empty text -> `None` at line 162. The docstring at
  lines 145-147 states this explicitly.
- **`<system-reminder>` blocks**: stripped by regex before anything else
  (`_SYSTEM_REMINDER_RE`, `scripts/archive.py:130`, applied at line 161).
- **Meta entries** (the expanded body of a slash command / skill):
  `entry.get("isMeta")` -> `continue` (`scripts/archive.py:269-270`).
- **`/clear`**: recognized by command name and returned as `None`
  (`scripts/archive.py:173-178`) — Claude Code seeds the `/clear` record into
  the NEW session's transcript, so keeping it would archive a bare `/clear` turn.
- **Other command / local-command wrapper plumbing**: `_COMMAND_WRAPPER_RE`
  (`scripts/archive.py:138`) matches a leading `<command-…>` / `<local-command-…>`
  tag and the entry is dropped (`scripts/archive.py:180-181`).

Verdict: the README claim is accurate as implemented, and the exclusion set is
in fact wider than the README states (it also drops meta/expanded command bodies,
system reminders, `/clear`, and all sidechain/subagent content).

### Deduplication key

`parse_transcript` (`scripts/archive.py:286-289`) wraps `_content_entries` and
attaches a key from `_entry_key` (`scripts/archive.py:198-203`): the entry's
`uuid` when present, otherwise `"h:" + sha1(role:text)[:16]`. This key is what
makes the four overlapping archive triggers idempotent — see Output format below.

Deliberate non-behavior: `_content_entries`'s docstring (`scripts/archive.py:246-253`)
records that queued-attachment prompts and `type: "user"` prompts are treated as
two disjoint shapes with **no cross-shape text deduplication**, on the stated
evidence of "34 real queued prompts: zero reappeared as a user entry."

### Title and start-time extraction (separate scans)

- `session_title` (`scripts/archive.py:444-470`) scans for the **first**
  `type: "ai-title"` entry with a non-empty `aiTitle`. First-wins is deliberate:
  the docstring (lines 446-453) records that Claude Code re-stamps ai-title
  entries from a cache that can hold a stale title after `/clear`.
- `session_start` (`scripts/archive.py:473-506`) returns the local-time timestamp
  of the first *content* block (lines 484-488), falling back to the first
  timestamped entry of any kind (lines 490-504), then to now (line 506). The
  docstring (lines 475-481) records why: a post-`/clear` transcript is seeded with
  the `/clear` record carrying the previous session's timestamp.
- `transcript_session_id` (`scripts/archive.py:967-987`) reads `sessionId` /
  `session_id` from the **first non-blank line only** (the `break` at line 984),
  falling back to the filename stem.
- A **second title channel** exists outside the transcript: `user_session_name`
  (`scripts/archive.py:297-345`) scans Claude Code's per-process session registry at
  `~/.claude/sessions/*.json` (`scripts/archive.py:294`) for entries matching the
  session id, ignoring any whose `nameSource == "derived"` (line 331), preferring a
  live pid then newest `updatedAt` (lines 333-344). The docstring (lines 300-316)
  records that `/rename` writes *only* here and never reaches the transcript, and
  vice versa. `display_title` composes the precedence
  explicit-name > ai-title > `/clear` cwd label (`scripts/archive.py:427-441`).

---

## Output format

### Filename scheme

Computed in `resolve_relpath` (`scripts/archive.py:651-689`):

```
<subdir>/<YYYY-MM>/<YYYY-MM-DD-HHMM>-<slug>.md
```

- `month = start.strftime("%Y-%m")` (line 666)
- `date = start.strftime("%Y-%m-%d-%H%M")` (line 667) — session-start local time,
  persisted in state so it never drifts (`scripts/archive.py:1938-1947`)
- `base_slug = slugify(title) if title else short_sid(session_id)` (line 668)
- `pre = f"{subdir}/"` when connected to Second Brain, else `""` (line 673)

`slugify` (`scripts/archive.py:586-594`): strip, whitespace -> `-`, drop everything
that is not `\w` or `-` (Unicode `\w`, so CJK and `_` survive), collapse repeated
dashes, strip leading/trailing `-_`, truncate to `MAX_SLUG_LEN = 60`
(`scripts/archive.py:61`), and fall back to `"untitled"` (line 594).
`short_sid` takes the first dash-segment of the session id, capped at 8 chars
(`scripts/archive.py:597-598`).

**Collision handling** — three candidates are tried in order (lines 674-677):
bare name, name + `-<short_sid>`, name + `-<full session_id>`. A candidate is
taken if the index already assigns it to this session (lines 680-682) or if it is
unowned **and** either equals our current path or does not exist on disk
(lines 683-687). The docstring (lines 656-665) explains the on-disk check: the
index lives under `~/.claude`, not in the repo, so after a fresh install or a
`git pull` on another machine a markdown file can exist with no index entry.
The full-session-id candidate is the guaranteed-unique fallback (line 689).

### Markdown layout

`render_markdown` (`scripts/archive.py:696-738`) emits:

```
# <ai-title or "Session <short_sid>">          (lines 700, 703)

- **Session**: `<session_id>`                   (line 705)
- **Started**: YYYY-MM-DD HH:MM +ZZZZ           (line 706)
- **Machine**: <hostname> (<ip>)                (lines 709-715, conditional)
- **tmux session**: `<name>`                    (lines 716-717, conditional)
- **Turns archived**: N user / M assistant      (line 719)

---                                             (line 721)

## [person emoji] User                          (line 728)

<text>

## [robot emoji] Assistant                      (line 732)

<text>

> [compaction divider blockquote]               (lines 735-736)
```

Counts come from `blocks` (lines 698-699). The file always ends with exactly one
trailing newline (`"\n".join(lines).rstrip() + "\n"`, line 738). The two role
headings use literal emoji escapes at lines 728 and 732; the compaction divider
is emitted as a bare blockquote line with no heading (lines 735-736).

Host metadata is gathered by `machine_meta` (`scripts/archive.py:565-579`):
`socket.gethostname()` (lines 513-518), the primary LAN IP discovered by UDP-connecting
a socket to `8.8.8.8:80` and reading `getsockname()` without sending packets
(lines 521-540), and the tmux session name from `tmux display-message -p '#S'`
when `$TMUX` is set (lines 543-562). Keys that resolve empty are omitted (lines 570-578),
and `_archive_locked` merges fresh values over stored ones so a transient blank
never clobbers a previously captured value (`scripts/archive.py:1949-1964`), with one
exception: `tmux` is dropped when `$TMUX` is unset, which is authoritative
(lines 1962-1963).

### How an in-progress session is updated: full rewrite from state, not append

The write path is `_archive_locked` (`scripts/archive.py:1904-2115`):

1. **Accumulate** (lines 1910-1920). Load the per-session state, build a `seen`
   set from `state["keys"]`, iterate `parse_transcript`, and append only keys not
   already seen — both to `state["keys"]` and to `state["blocks"]` as
   `{"role": …, "text": …}`. This is the append-only half and the idempotency
   guarantee across the four overlapping triggers.
2. **Skip empty** (lines 1922-1927): if `state["blocks"]` is empty, return `None`
   without writing — a fresh post-`/clear` transcript holding only the seeded
   `/clear` record never produces a header-only file.
3. **Title and start** (lines 1929-1947): title refreshed from the transcript and
   stored; `start` computed once and persisted (`state["start"]`) because
   recomputing is unstable when the transcript has no timestamps.
4. **Resolve path, rename if the title changed** (lines 1966-1997). When the
   resolved path differs from `state["file"]`, the old file is moved with
   `git mv` (line 1980) — preserving history — falling back to a filesystem
   `Path.replace` if git mv fails because the file is untracked (lines 1981-1983).
   If both fail, the run keeps writing to the OLD path so it never ends up with
   two files for one session (lines 1984-1997).
5. **Render** the whole document from the full accumulated state (line 2001) —
   the markdown is a **complete rewrite every turn**, never an append.
6. **Stale-duplicate cleanup** (lines 2004-2043): any *other* path the index still
   attributes to this session is deleted, but only when `body_covers(old_body, new_body)`
   proves the new file is a superset (lines 2029-2032).
7. **Never-shrink guard** (lines 2045-2066): if the file already on disk is NOT
   covered by the new render, the session releases its claim on that path,
   persists the release, and diverts the render to a fresh suffixed path
   (lines 2057-2066) — the richer file survives untouched.
8. **Write** (lines 2068-2071), update `state["file"]` and the index (lines 2073-2077),
   log the run (lines 2079-2080).

The state file shape is normalized on load by `load_state`
(`scripts/archive.py:609-626`): `title`, `file`, `blocks[]`, `keys[]` are
defaulted/coerced so a corrupt or partial file cannot crash the hook; `start`
and `machine` are added by `_archive_locked` (lines 1947, 1964).

The prefix logic that makes the rewrite safe: `turns_body` splits on the first
`"\n---\n"` and returns the per-turn portion (`scripts/archive.py:741-748`);
`body_covers` requires the old body to be a prefix of the new one *terminated at a
turn boundary* — `new_body[len(old_body):].startswith("\n\n")`
(`scripts/archive.py:751-764`) — so a turn whose text is a string prefix of a
longer turn ("testing" vs "testing123") cannot false-positive. `_on_disk_covered`
returns False on `OSError` so an unreadable file is never mistaken for empty
(`scripts/archive.py:767-778`).

### Concurrency

All hook-driven archiving runs under an exclusive `fcntl.flock` on
`~/.claude/cc-conversation-archiver/archive.lock` (`scripts/archive.py:1853-1856`),
because different sessions share `_index.json` and the one git repo
(comment at lines 1849-1852). Pushes take a separate lock, `push.lock`
(`scripts/archive.py:839-841`). State, index and config writes are atomic
temp-file-plus-`replace` (`scripts/archive.py:629-633`, `644-648`, `119-123`).

**Platform note as implemented:** `fcntl` is imported unconditionally at module
scope (`scripts/archive.py:33`), and `user_session_name`'s liveness probe is
gated on `os.name == "posix"` (`scripts/archive.py:335`) with the docstring
noting that on Windows `os.kill(pid, 0)` terminates the target (lines 314-316).
`report_title.ensure_watcher` returns early on non-POSIX (`scripts/report_title.py:167-170`),
as does `title_watch.main` (`scripts/title_watch.py:201-202`).

---

## Git sync

### Repo bootstrap

`ensure_repo` (`scripts/archive.py:818-831`): `mkdir -p`, `git init` if `.git`
is absent (lines 819-822), set a local commit identity
(`cc-archiver@localhost` / `cc-conversation-archiver`) when `user.email` is unset
(lines 824-827), and create a `.gitignore` containing `.DS_Store` if absent
(lines 829-831). Default repo path is `~/claude-conversations`
(`scripts/archive.py:60`), overridable by `CC_ARCHIVE_REPO` env or the `repo`
config key, env taking precedence (`scripts/archive.py:98-100`). Mode resolution
is the same shape and clamps to `auto`/`manual` (`scripts/archive.py:103-105`).

### Auto-mode per-turn sync

At the end of `_archive_locked` (`scripts/archive.py:2098-2115`): when
`do_commit` is True and mode is `auto`, run `git add -A` (line 2105), check
`git status --porcelain` and return early if clean (lines 2106-2108), commit with
message `archive: <YYYY-MM-DD> <title or short_sid>` (lines 2109-2110), and on
success call `push_background(repo)` (line 2114). A failed commit is logged and
the run returns without pushing (lines 2111-2113).

### The push itself

`do_push` (`scripts/archive.py:834-870`), reached either directly (`--upload`,
`--backfill`) or via the detached `--push-only` child:

1. Take the exclusive `push.lock` via `fcntl.flock` (lines 839-841). The docstring
   (lines 835-838) notes Python `fcntl` is used specifically because macOS ships no
   `flock` binary.
2. **Only if a remote exists** (`git remote` non-empty, line 852): run
   `git -c rebase.autoStash=true pull --rebase -X theirs` with `timeout=120`
   (lines 853-854).
3. On a non-zero rebase result: log the first 200 chars (lines 855-857) and, if
   `.git/rebase-merge` or `.git/rebase-apply` exists, run `git rebase --abort`
   so the repo is never stranded mid-rebase (lines 858-860).
4. `git push` with `timeout=120` (line 861), still inside the lock.
5. Append the combined stdout+stderr to `push.log` (lines 862-867) and log the
   return code on failure (lines 868-869).

**Conflict posture:** `-X theirs` under rebase resolves in favour of the commit
being replayed — i.e. the local commit — which the comment at lines 845-848
describes as "last commit wins", and states the purpose: a repo pushed to from
several machines never wedges in a permanent non-fast-forward reject, and history
stays linear. **Offline posture:** the pull and push return non-zero (or rc 124 on
the 120s timeout via `run_git`, `scripts/archive.py:810-815`), the failure is
written to `push.log` and `archive.log`, and nothing else happens — the next
turn commit triggers another push attempt. **No remote at all:** step 2 is
skipped entirely and `git push` fails; commits accumulate locally
(`plugins/conversation-archiver/README.md:150-151`).

**Blocking:** the auto path never blocks the session because the push runs in the
detached child (`scripts/archive.py:873-884`). The `--upload`, `--backfill` and
`--connect` paths do run the push in the foreground, but those are user-invoked
slash commands, and each git call is timeout-bounded.

### `connect` (Second Brain)

`do_connect` (`scripts/archive.py:1286-1413`). Three credential paths, in order:

1. **One-time code (primary).** If the argument contains `/sb-connect/` and no
   token was passed, `_redeem_connect_code` (`scripts/archive.py:1207-1262`)
   extracts the trailing code, POSTs a `{"code": ...}` body to
   `<scheme>://<netloc>/api/memo_v2/sources/claude-code/activate` (lines 1226-1235)
   with a 30s timeout, and reads `remote_url` + `token` from the response
   (lines 1237-1244). HTTP 404 prints a specific "expired or already used
   (single-use, 10 minutes)" message (lines 1245-1254).
2. **gsk token self-resolve.** `_read_local_gsk_token` (`scripts/archive.py:1165-1179`)
   reads `$GSK_API_KEY` then `~/.genspark-tool-cli/config.json` -> `api_key`
   (`scripts/archive.py:77`). `_resolve_push_url` (`scripts/archive.py:1182-1204`)
   GETs `https://www.genspark.ai/api/memo_v2/sources/claude-code/resolve`
   (`scripts/archive.py:73-74`, `GSK_BASE_URL` overridable) with a Bearer header
   and returns `remote_url`. If no token is found, `_guide_gsk_setup`
   (`scripts/archive.py:1265-1283`) prints the two-step install/login guidance.
3. **Explicit `<remote_url> <token>` args** (`scripts/archive.py:1800-1805`).

Then, in order (`scripts/archive.py:1339-1413`):

- **Credential**, stored outside the repo: unlink any pre-existing file, then
  `os.open(CRED_FILE, O_WRONLY|O_CREAT|O_TRUNC, 0o600)` so the token is never
  world-readable even momentarily (lines 1343-1351); the line written is
  `<scheme>://x-access-token:<token>@<netloc>` (line 1348).
  `git config credential.helper "store --file ..."` — single-quoted in the config
  value so a HOME containing spaces survives (lines 1354-1355) — and
  `git config push.default upstream` (line 1358).
- **Remote**: `set-url` if `origin` exists, else `remote add` (lines 1361-1364).
- **Migration**: `_migrate_into_subdir` (`scripts/archive.py:1122-1162`) git-mv s
  every top-level `YYYY-MM` directory under `claude-code/`
  (`SB_DEFAULT_SUBDIR`, `scripts/archive.py:67`), falling back to a filesystem
  move for untracked dirs (lines 1134-1141), then rewrites every `_index.json`
  key and every per-session `state["file"]` to the prefixed path (lines 1143-1161).
  Then commits the move (lines 1368-1370).
- **Config persisted BEFORE the network steps** (lines 1372-1375), so a flaky
  first push cannot leave later turns writing the un-prefixed layout.
- **Sparse checkout** to the subfolder only (line 1380), so the rest of the
  vault never materializes on the machine.
- **History integration**: `git fetch origin main` (timeout 120, line 1385);
  a failed fetch aborts with a message (lines 1386-1390). If HEAD exists,
  `pull --rebase -X theirs origin main` with the same abort-on-wedge cleanup
  (lines 1391-1400); if not (connect before the first archived turn),
  `git reset --hard FETCH_HEAD` (line 1402). Finally
  `git push -u origin HEAD:main` (line 1403); a failed first push is reported as
  "will be retried on your next archived turn" (lines 1404-1408).

### `upload` and `repo`

`do_upload` (`scripts/archive.py:887-913`): bail with a message if `.git` does not
exist yet (lines 893-896); under the archive lock, `git add -A`, commit
`manual upload: <timestamp>` if the tree is dirty, else print "nothing new to upload"
(lines 898-907); then `do_push` outside the lock and print the pushed-repo line or
the remote-setup hint (lines 908-913).

`do_set_repo` (`scripts/archive.py:1416-1474`) is explicitly **repoint-only**
(docstring lines 1417-1426): it validates the path is absolute and a directory
(lines 1427-1437), writes `cfg["repo"]`, and distinguishes three outcomes —
already set (line 1446), textually different but resolving to the same directory
(lines 1447-1454), and a real repoint (lines 1455-1461). It always then warns if
`CC_ARCHIVE_REPO` is set and overriding (lines 1466-1470) and notes if the user is
in connected mode (lines 1471-1474).

---

## backfill

`do_backfill` (`scripts/archive.py:1042-1119`), invoked as `archive.py --backfill`
(`scripts/archive.py:1783-1785`) by `commands/backfill.md:7`.

Walk:

1. Resolve config and `claude_projects_dir()`; if the dir does not exist, print
   and return (lines 1049-1054).
2. `sorted(projects.glob("*/*.jsonl"))` (line 1058) — **top-level session
   transcripts only**. The comment at lines 1055-1057 states that deeper files
   (`<sid>/subagents/agent-*.jsonl`) are subagent transcripts and are deliberately
   excluded. Empty result -> print and return (lines 1059-1061).
3. `ensure_repo` (line 1063), then take the archive lock ONCE for the whole sweep
   (lines 1065-1067).
4. Per transcript: resolve the session id via `transcript_session_id`, skip if
   absent or if `transcript_has_content` is False (lines 1069-1072).
   `transcript_has_content` (`scripts/archive.py:990-995`) short-circuits on the
   first yielded block, so empty and tool-only sessions cost one partial scan.
5. Call `_archive_locked(sid, tpath, "backfill", do_commit=False)` — the same
   function the hooks use, which is what makes backfill idempotent: turns are
   keyed by uuid, so a re-run only adds new ones and never forks a file
   (docstring lines 1043-1048).
6. A raising transcript is caught per-item and counted as skipped, so one bad file
   cannot abort the sweep (lines 1078-1080). Progress is printed every 25 sessions
   (lines 1081-1082).
7. **One commit for the entire sweep** (lines 1083-1096), tracking three distinct
   outcomes — clean tree, successful commit, failed commit — so a clean tree and a
   failed commit do not look alike (comment lines 1083-1084). Message:
   `backfill <N> session(s): <timestamp>`.
8. After releasing the lock: log and print the summary
   (`backfilled N session(s) (skipped M empty/unreadable of T transcripts)`,
   lines 1098-1101). A failed commit is fatal and returns before pushing
   (lines 1103-1108). Otherwise push unconditionally — even when nothing was
   committed this run — so a previous backfill unpushed commits get retried
   (lines 1111-1119).

---

## doctor

`do_doctor` (`scripts/archive.py:1532-1766`), invoked as `--doctor`
(`scripts/archive.py:1786-1788`) from `commands/doctor.md:7`. Declared READ-ONLY
in its docstring (lines 1533-1542): it never mutates the repo and never pushes.

Two structural details worth copying:

- A local `p()` accumulator appends lines to a list and the whole report is
  printed once at the end (lines 1554-1555, 1766) — the output is a single
  markdown document the model then explains.
- A local `g()` wrapper forces `quiet=True` on every git call (lines 1557-1561),
  because `--doctor` reads `archive.log` back at the end and a non-quiet
  missing-git/timeout path would pollute the very "recent errors" section it is
  reporting (comment lines 1558-1560).

Findings are bucketed into two lists — `problems` ("broken — needs a fix") and
`notes` ("advisory — works, but worth knowing") — declared at lines 1551-1552.

Sections, in order:

| Section | Lines | Checks |
|---|---|---|
| Dependencies | 1566-1575 | python3 version from `sys.version`; `shutil.which("git")`; missing git -> problem |
| Config | 1577-1588 | mode (with a plain-language gloss), repo, subdir if connected, and whether `CC_ARCHIVE_*` overrides are active |
| Archive repo | 1596-1612 | repo not created / exists-but-not-git / git-missing-so-skipped / OK + last commit (`log -1 --date=local`) + count of pending uncommitted changes |
| Sync / remote | 1614-1698 | see below |
| Second Brain credential | 1700-1711 | only when `subdir` is set: credential file present + its octal mode; missing -> problem |
| Archive activity | 1713-1732 | number of state files (excluding `_index.json`); mtime of the newest as "most recent archived turn"; none -> note telling the user to restart the session and/or run backfill |
| Recent errors | 1734-1741 | last 200 lines of `archive.log` filtered to those containing ERROR or failed, last 6 shown |
| Recent push output | 1742-1747 | last 4 lines of `push.log` |
| Verdict | 1749-1764 | problems first, else notes, else a mode-specific all-clear |

The Sync/remote section is the most involved:

- Every git-dependent section is gated on `git_ok = git_path is not None`
  (line 1594) and reports "skipped" rather than asserting a false state — the
  comment at lines 1590-1593 explains that without git every probe returns
  empty, which would misreport a real repo as absent.
- A failed `git remote -v` is reported as UNKNOWN rather than "no remote"
  (lines 1623-1630).
- No remote at all is a **note**, not a problem, with the exact remediation
  commands (lines 1631-1637).
- The probed remote is derived from the branch actual upstream
  (`rev-parse --abbrev-ref --symbolic-full-name @{u}`, lines 1646-1654), falling
  back to `origin` then the first remote — the comment (lines 1639-1644) states
  this is so the connection test matches the real push path.
- **Live read-only auth probe**: `git ls-remote --heads <name>` with `timeout=20`
  (line 1674). rc 0 -> "OK — reachable, auth works"; rc 124 -> "TIMED OUT (>20s)"
  reported as a *note* about network, explicitly not an auth problem
  (lines 1677-1685); any other non-zero -> FAILED, with up to 4 masked stderr
  lines inlined and a problem entry (lines 1686-1695).
- **Secret masking everywhere**: `_URL_CRED_RE` (`scripts/archive.py:1499`) and
  `_mask_url` (lines 1502-1503) replace HTTP(S) userinfo with three asterisks.
  The comment block at lines 1488-1498 enumerates the two leaking shapes
  (token as password, and token as the whole userinfo), why the user half
  excludes a slash (so a credential-free URL with an at-sign in its *path* is not
  over-masked), and that SSH remotes carry no secret. Masking is applied to the
  remote line (1658), to ls-remote error lines (1690), and to both log tails
  (1740, 1746). `do_status` masks the same way (line 1523).
- The slash command frontmatter deliberately omits `disable-model-invocation`
  (`commands/doctor.md:1-5`) so the model can run it from natural language, and
  the command body instructs the model to explain each problem with the exact
  next step and to "Never print any credential/token value"
  (`commands/doctor.md:9-14`).

`do_status` (`scripts/archive.py:1506-1529`) is the smaller sibling: mode, repo,
first masked remote line, `git log --oneline -5`, and the first 10 lines of
`git status --short`, with a no-git-repo early path at lines 1514-1519.

---

## Failure posture

The README claim — "If either is missing the plugin prints one warning at session
start and quietly does nothing (it never blocks a prompt)" (`README.md:20-22`) —
is enforced at four layers:

1. **`hooks/check_deps.sh`** (33 lines) is the one-warning implementation. It is
   written in bash on purpose so it runs when python3 is absent (comment line 10).
   It builds a `missing` array from `command -v python3` / `command -v git`
   (lines 19-21), and when non-empty echoes a single line
   `[conversation-archiver] missing dependency: ... conversation archiving is
   DISABLED until it is installed` (lines 23-25) and appends the same line to
   `archive.log` (lines 26-29). It ends with an unconditional `exit 0` (line 32).
   The comment at lines 3-8 records the design reason: Claude Code has no
   arbitrary-code gate at `/plugin install` time, so SessionStart is the idiomatic
   place to verify runtime dependencies.
   The same script also persists `CLAUDE_PLUGIN_ROOT` to
   `~/.claude/cc-conversation-archiver/plugin_root` (lines 12-17) — the mechanism
   the slash commands use to locate `archive.py`.
2. **Shell guards in the manifest**: the `command -v ... && ... || true` chain
   (`hooks/hooks.json:33,43,53,67` for archive; `13,23,57` for title). A missing
   interpreter is a clean no-op.
3. **Unconditional exit 0** at every script entry point:
   `scripts/archive.py:2118-2123` (logs the traceback as ERROR first),
   `scripts/report_title.py:346-351` (silent), `scripts/title_watch.py:210-215`
   (silent), and `scripts/notify.py:205-210` (exits 1 but never raises to a caller).
4. **Never-raise helpers throughout**: `log` swallows everything
   (`scripts/archive.py:80-87`); `load_config`/`load_state`/`load_index` return
   normalized defaults on any exception (lines 90-95, 609-626, 636-641);
   `run_git` converts missing-binary and timeout into synthetic return codes
   (lines 785-815); `machine_ip`/`tmux_session`/`machine_hostname` return
   empty/None on failure (lines 513-562); `_maybe_notify` imports `notify` lazily
   inside a try and catches everything (`scripts/archive.py:1866-1901`);
   `notify.emit` returns False rather than raising when there is no usable tty
   (`scripts/notify.py:143-184`).

Data-loss posture is a separate, explicitly-stated invariant: "Content is NEVER
deleted" (`scripts/archive.py:15-18`). Its enforcement points are the append-only
state accumulation (lines 1910-1920), the `body_covers` prefix proof before any
stale-file deletion (lines 2029-2032), the never-shrink divert (lines 2045-2066),
and the read-error-means-not-covered rule (`_on_disk_covered`, lines 767-778).
Rename failures degrade to keeping the old path rather than forking a file
(lines 1984-1997).

Opt-out: `CC_ARCHIVE_NO_NOTIFY` disables notifications and watcher spawning while
leaving archiving untouched (`scripts/archive.py:1872-1873`,
`scripts/report_title.py:261-262`, `scripts/title_watch.py:201-202`).

---

## Plugin structure notes

### Two-level manifest layout

```
.claude-plugin/marketplace.json          <- marketplace (repo root)
plugins/
  conversation-archiver/
    .claude-plugin/plugin.json           <- plugin manifest
    hooks/hooks.json
    hooks/check_deps.sh
    commands/*.md
    scripts/*.py
    README.md
```

`.claude-plugin/marketplace.json` (15 lines) declares `name`
(`cc-conversation-archiver`, line 2), an `owner` object with name/email
(lines 3-6), and a `plugins` array whose single entry carries `name`, `source`
(the relative path `./plugins/conversation-archiver`), `description`, and
`category: "productivity"` (lines 8-13).

`plugins/conversation-archiver/.claude-plugin/plugin.json` (9 lines) is minimal:
`name`, `version` (`0.11.0`), `description`, `author` (name + email). It declares
**no** `commands`, `hooks`, `skills`, or `agents` keys — those are discovered
from the conventional directory layout. `RELEASING.md:44` notes that at publish
time the plugin-level `.claude-plugin/marketplace.json` becomes the published
repo-root marketplace manifest.

### Commands

Eight files in `commands/`, each a markdown file with YAML frontmatter plus a body.
Frontmatter keys in use:

| Key | Where | Effect |
|---|---|---|
| `description` | every file, line 2 | the listed command description |
| `disable-model-invocation: true` | `auto.md:3`, `backfill.md:3`, `connect.md:4`, `manual.md:3`, `repo.md:3`, `status.md:3`, `upload.md:3` | manual-invoke only |
| `allowed-tools: Bash` | every file | the only tool the command may use |
| `argument-hint` | `connect.md:5`, `repo.md:5`, `doctor.md:4` | argument prompt text |

`doctor.md` is the **only** command without `disable-model-invocation`
(`commands/doctor.md:1-5`) — it is read-only, so it is the one operation Claude
may initiate on its own.

Each command body is the same two-part shape:

1. A **bang-prefixed inline bash block** (backtick-wrapped) whose stdout is
   injected into the prompt. The shared preamble (`commands/backfill.md:7`,
   `connect.md:8`, `doctor.md:7`, `repo.md:8`, `status.md:7`, `upload.md:7`)
   reads the plugin root from `$HOME/.claude/cc-conversation-archiver/plugin_root`,
   prints "python3 and git are required" if either binary is missing, prints
   "plugin not initialized yet — start a session with the plugin enabled first
   (SessionStart records its path)" if the root file or `archive.py` is absent,
   and otherwise runs `python3 "$ROOT/scripts/archive.py" --<mode> $ARGUMENTS`.
   This is the counterpart of `check_deps.sh:12-17`: commands do not reliably get
   `CLAUDE_PLUGIN_ROOT`, so the SessionStart hook writes it to disk and the
   commands read it back.
   `auto.md:7` and `manual.md:7` skip `archive.py` entirely and inline a one-line
   `python3 -c` that merges `mode` into `config.json` (preserving any custom `repo`).
2. A **natural-language instruction to the model** telling it what to do with the
   captured output — e.g. `commands/doctor.md:9-14` (read the report and explain it
   in plain language, give the exact next step per problem, and never print any
   credential or token value), `commands/connect.md:10-11` (never echo the token
   back to the user), `commands/repo.md:10-11` (surface any WARNING or NOTE line).

### What makes it prompt-drivable

`README.md:24-38` frames this as "Quick start (just ask Claude)". The mechanism
is three-part: (a) `doctor` is model-invocable and its frontmatter `description`
(`commands/doctor.md:2`) enumerates the symptoms that should trigger it — use it
when archiving is not working, a push is not landing, or to verify a remote right
after connecting it; (b) every command prints a **structured plain-text report to
stdout** that the model then relays or explains; (c) the non-doctor commands stay
`disable-model-invocation: true`, so the model can walk the user *to*
`connect`/`backfill` but the user still fires them. `README.md:35-38` states the
only thing Claude cannot do is the initial `/plugin install`.

### Release mechanics

`RELEASING.md` documents development in a private monorepo
(`toolkits/cc-conversation-archiver/**`) mirrored to a public marketplace repo by
a GitHub Action (lines 3-21). The version bump is a normal reviewed PR
(lines 35-38); the workflow refuses to run if a GitHub Release for
`conversation-archiver--v<version>` already exists (lines 48-52), which forces the
bump; it must be dispatched from `main` (lines 54-55); `tests/`, `__pycache__/`,
`*.pyc` are excluded from the published tree (line 46). Tag scheme
`conversation-archiver--v<version>` matches what `claude plugin tag` produces
(lines 59-61).

### Ancillary subsystems (not part of the archive path)

`scripts/notify.py` (210 lines) is a self-contained OSC 9999 emitter — it
base64-encodes a JSON payload (`v`, `magic` = "genterm-notify", `source`,
`sourceId`, `event`, `title`, `body`, optional `tmux`) into an OSC 9999 escape
sequence terminated by ST (`notify.py:38-40,145-157`), wraps it in tmux DCS
passthrough with every inner ESC doubled when `$TMUX` is set
(`notify.py:79-83,159-170`), and resolves a target tty in three steps — tmux
pane_tty, then `/dev/tty`, then walking up to 8 ancestor processes with
`ps -o tty=` (`notify.py:86-129`) — because Claude Code runs hooks detached from
the controlling terminal (comment lines 89-90). It is documented as reusable by
any CLI tool (`notify.py:11-25`, `plugins/conversation-archiver/README.md:269-296`).

`scripts/report_title.py` + `scripts/title_watch.py` are the title-immediacy path:
the hook-driven reporter runs on SessionStart/UserPromptSubmit/PostToolUse
(`report_title.py:12-14` docstring) and keeps a detached per-session daemon alive
(`ensure_watcher`, `report_title.py:153-194`) that polls every 1.5s using a
stat-only fingerprint of the session registry plus the transcript
(`title_watch.py:52,85-104,174-177`), exiting when superseded by a newer watcher,
when the session pid disappears for 4 consecutive liveness checks, or after a
7-day lifetime backstop (`title_watch.py:57-59,162-178,181-188`). The stated reason
for the daemon: `/rename` fires **no hook** (`title_watch.py:4-10`). The target tty
is decoupled from spawn time via a `.tty` state file refreshed by every hook run
(`report_title.py:99-134`), because a detached daemon cannot resolve one itself.

---

## Lift notes — capture half for sankofa + chat-log-access, and how it pairs with deja-vu recall half

Framing: `vshulcz/deja-vu` reads harness session logs (the **recall** half).
This repo writes clean transcripts (the **capture** half). They meet at the same
input — `~/.claude/projects/<encoded-project>/<session-id>.jsonl` — but produce
opposite artifacts: deja-vu queries the raw JSONL in place; the archiver
materializes a durable, human-readable, git-versioned rendering that outlives
transcript truncation.

**1. The JSONL reader is the reusable core, and it is one function.**
`_content_entries` (`scripts/archive.py:240-283`) is ~44 lines and encodes every
non-obvious rule about the Claude Code transcript format that a recall tool also
needs: `isMeta` entries are expanded command bodies, not user input (269-270);
tool results arrive as `type: "user"` with a list content (145-147, 151-157);
queued mid-turn prompts appear *only* as `attachment` / `queued_command` and are
invisible to a naive `type == "user"` scan (221-237); `<system-reminder>` blocks
must be regex-stripped (130, 161); slash-command invocations need reconstruction
from `<command-name>` / `<command-args>` (134-135, 164-179); `/clear` is seeded
into the *next* session transcript (173-178, 475-481). Any sankofa or
chat-log-access reader over the same files needs the same rules; this is the
shortest correct statement of them found so far.

**2. Two independent title channels — a recall tool must read both.**
`user_session_name` (`scripts/archive.py:297-345`) documents, with a dated live
verification, that `/rename` writes only to `~/.claude/sessions/<pid>.json` and
never reaches the transcript, while the transcript ai-title never reaches the
registry. `session_title` (444-470) additionally documents that **first**-ai-title
wins because later stamps can come from a stale post-`/clear` cache.
`display_title` (427-441) is the composed precedence. A find-my-past-chat-by-name
feature that reads only one channel will miss renamed sessions or surface stale
titles.

**3. Stable session identity across compaction and `/clear`.**
Keying on `session_id` (`scripts/archive.py:12-14`) is what makes one session one
file. `transcript_session_id` (967-987) recovers the id from the first line or the
filename stem. The `/clear` boundary behaviors — new session id, carried-over
registry name (`effective_user_session_name`, 365-385), seeded `/clear` record with
the previous session timestamp (`session_start`, 473-506) — are the exact edge
cases that make naive "session started at" and "session named" values wrong.

**4. The durability argument for a capture half.**
`scripts/archive.py:15-18` states the case directly: accumulate every turn into a
local state file keyed by message uuid and rebuild from that state, so even if a
future Claude Code version were to truncate the on-disk transcript after
compaction, already-archived turns survive. That is precisely the failure mode a
recall-only tool (reading the harness logs live) is exposed to, and it is the
argument for pairing capture with recall rather than choosing one.

**5. Idempotency by uuid is what allows overlapping triggers.**
`_entry_key` (198-203) plus the `seen` set (1912-1920) mean four events can fire
for the same turn with no duplication, which is what lets the design use `Stop`
for latency and `UserPromptSubmit` / `SessionEnd` as backstops
(`plugins/conversation-archiver/README.md:44-65`). Any capture hook that writes
per-turn needs this property before it can afford redundant triggers.

**6. The never-lose-content ratchet.** `turns_body` / `body_covers` /
`_on_disk_covered` (741-778) plus the never-shrink divert (2045-2066) constitute a
small, self-contained protocol for: this rewrite is provably a superset of what is
on disk, otherwise preserve the old file and write elsewhere. Directly applicable
to any tool that rewrites a file from reconstructed state.

**7. The `doctor` pattern.** `do_doctor` (1532-1766) is the diagnostic shape worth
copying wholesale: buckets findings into `problems` vs `notes`; gates each section
on its prerequisite and reports skipped/UNKNOWN instead of asserting a false
negative (1590-1594, 1623-1630); distinguishes timeout (rc 124) from auth failure
(1677-1685); does one **live read-only probe** of the real path
(`git ls-remote`, 1674) rather than inferring health from config; masks secrets on
every output path (1499-1503, 1658, 1690, 1740, 1746); forces its own git calls
quiet so it does not pollute the log it reads back (1557-1561); and ends in a
single Verdict block with numbered concrete fixes (1749-1764). Paired with a
model-invocable command whose body says to explain it in plain language and give
the exact next step (`commands/doctor.md:9-14`), the diagnostic becomes
conversational without the model having to reason about the system itself.

**8. The `plugin_root` handshake.** `check_deps.sh:12-17` writes
`CLAUDE_PLUGIN_ROOT` to a known file at SessionStart, and every command reads it
back (`commands/*.md:7-8`). This is the documented workaround for commands not
reliably receiving the variable, and it doubles as an is-the-plugin-initialized
check with a specific error message.

**9. Backfill reuses the live path.** `do_backfill` calls the same
`_archive_locked` the hooks call, with `do_commit=False`
(`scripts/archive.py:1074-1076`), and commits once for the whole sweep
(1083-1096). A historical-import path for sankofa gets idempotency for free by
being the same code, and the per-item try/except (1078-1080) keeps one corrupt
transcript from aborting the sweep.

**10. Portability facts to note before lifting.** `fcntl` is imported at module
scope (`scripts/archive.py:33`) — POSIX-only. The tty/notify subsystem
(`notify.py:86-129`), the watcher daemon (`title_watch.py:32-34`,
`report_title.py:167-170`), and the registry liveness probe
(`scripts/archive.py:335`, docstring 314-316) are all explicitly POSIX-gated,
the last because `os.kill(pid, 0)` terminates the target on Windows.
The Second Brain paths (`scripts/archive.py:67-77`, 1165-1413) are
vendor-specific and orthogonal to the capture mechanism.

**11. Hook-event menu observed in this plugin** (useful when choosing sankofa
trigger points): `SessionStart` (with a `source` field distinguishing
startup / resume / compact / clear — `report_title.py:287,306-309`),
`UserPromptSubmit`, `PostToolUse` (fires after every tool call, used here as a
few-second heartbeat), `Stop`, `SubagentStop`, `SessionEnd`. Payload fields
consumed: `session_id`, `transcript_path`, `hook_event_name`, `source`, `cwd`.
`title_watch.py:4-6` records the negative result that there is **no**
SessionRename event, which is why a polling daemon exists at all.
