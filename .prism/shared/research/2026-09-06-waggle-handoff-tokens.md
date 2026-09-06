---
date: 2026-09-06
topic: waggle — resolvable handoff tokens, consumer-profile projection, coverage contracts
repo: C:\Users\digit\GriotSandbox\xplatform-harvest\waggle
scope: mechanism documentation at file:line precision + lift notes for Spectrum / Griot-Wide Workgraph
status: documentarian — describes what exists, corrects prior claims
---

# Waggle: Resolvable Handoff Tokens

All paths below are relative to `C:\Users\digit\GriotSandbox\xplatform-harvest\waggle`.

Rust workspace, 129 `.rs` files / ~18.5k lines of crate source. Crate layout:

| Crate | Role |
|---|---|
| `waggle-core` | Sans-I/O domain: token, manifest, mint, resolve, matcher, contract, event, log, fold, trust |
| `waggle-ops` | The operations catalog — every operation declared exactly once |
| `waggle-mcp` | MCP JSON-RPC surface + handlers (mint/resolve/read/search/coverage/...) |
| `waggle-store*` | Storage backends: `memory`, `sqlite`, `fs-jsonl`, `cloudflare` |
| `waggle-tree` | Directory index, trigram index, Bloom filter (tree-scale mints) |
| `waggle-lens-code` | Symbol outline extraction |
| `waggle-cli`, `waggle-tmux`, `edge-worker`, `bench` | Surfaces and benchmark harness |

---

## 1. Mechanism (file:line)

### 1.1 The token — opaque, 24 bytes in memory, 8 characters on the wire

`crates/waggle-core/src/token.rs`

- `token.rs:44-47` — `struct Token { len: u8, buf: [u8; 23] }`. Inline, `Copy`, zero heap.
- `token.rs:181` — test asserts `size_of::<Token>() == 24`. This is the **in-memory struct size**, not the string length.
- `token.rs:21` — `MAX_LEN = 23`; `token.rs:28` — valid lengths are `1..=23` characters.
- `token.rs:16` — `TOKEN_ALPHABET` is the Bitcoin base58 alphabet (no `0`, `O`, `I`, `l`) — chosen at `token.rs:5-6` because "tokens get read aloud and typed."
- `token.rs:19` — `REJECTION_BOUND = 232` (= 58 × 4). `token.rs:72-98` — `generate()` rejection-samples: bytes ≥ 232 are **discarded, not folded**, so no alphabet position is favoured. The doc comment at `token.rs:6-7` states the reason: "modulo bias is how 'non-enumerable' quietly stops being true."
- `token.rs:116-122` — `Ord` is lexicographic by string form; deterministic map ordering is what byte-identical serialization (invariant R-1) rests on.
- `token.rs:136-159` — serde is a plain string in/out, validated through `Token::parse` on the way in.

**What is encoded inside the token: nothing.** The token carries no target, no sharer, no timestamp, no version, no checksum, no type tag. `token.rs:40-41` states it directly: *"Tokens are **names**, not data — comparison, hashing, and display are the whole interface."* It is pure rejection-sampled randomness over base58. Every fact about the artifact lives in the `AttributionManifest` retrieved by that name.

**Default length is 8 characters** — `mint.rs:41` (`MintOptions { token_len: 8 }`, documented as `58^8 ≈ 1.3 × 10^14` names), `mint.rs:44-48` (`Default`). A `private` mint overrides to **16 characters** (`mint.rs:240`), documented at `mint.rs:145-149` as a capability URL: "possession IS the credential," ≈ 94 bits.

### 1.2 The manifest — three zones, three mutability rules

`crates/waggle-core/src/manifest.rs:302-382` — `AttributionManifest`.

**Zone A — immutable core, fixed at mint and signed:**
`schema` (301), `token` (306), `target` (308), `sharer` (310), `channel` (312), `minted_at` (314), `meta` (317), `parent` (320), `content` (326), `variants` (328), `private` (333), `contract` (339), `outline` (346), `extraction` (354), `tree` (360).

**Zone B — variants**, fixed at mint in v1 (`manifest.rs:328`).

**Zone C — mutable, versioned, event-sourced:** `version` (366), `campaign` (369), `labels` (372), `expires_at` (375), `revoked_at` (378), `superseded_by` (381).

`manifest.rs:363-364` — `signature` is explicitly **not** part of the signed bytes.

Size caps: `target.rs:18` — `MANIFEST_SIZE_CAP_BYTES = 256 * 1024`; `target.rs:15` — `INLINE_THRESHOLD_BYTES = 64 * 1024` (above which a body becomes a `MediaRef` instead of inline).

### 1.3 Mint — a pure function

`crates/waggle-core/src/mint.rs:223-279` — `mint(spec, opts, entropy, now) -> Result<AttributionManifest>`.

- `mint.rs:229-238` — counts catch-all variants: 0 ⇒ synthesize one; 1 ⇒ accept; n > 1 ⇒ `MintError::DuplicateCatchAll`. The synthesized catch-all is **appended last** (`mint.rs:235`) so declared variants always win ties.
- `mint.rs:283-295` — `synthesized_catch_all()` builds an inline `text/markdown` body: the meta description, else `"Fetch the artifact at {target} and use it as your working context."`
- `mint.rs:240` — `token_len = if spec.private { 16 } else { opts.token_len }`.
- `mint.rs:261` — `version: 1` — the CAS baseline (contract C-9).
- `mint.rs:259` — `signature: None`; hosts holding an identity sign *after* mint.
- `mint.rs:271-277` — the serialized manifest is measured with `serde_json` and rejected over the cap.

Builder options on `MintSpec` (`mint.rs:72-212`): `.meta()`, `.variant()`, `.with_variant()`, `.child_of()` (lineage), `.label()`, `.private()`, `.content()`, `.contract()`, `.outline()`, `.extraction()`, `.tree()`, `.with_token()` (pre-generated — `mint.rs:196-204` explains this breaks the tree-mint cycle where a node's token is needed before its children but its Bloom only after them), `.ttl_ms()`.

### 1.4 Resolve — pure, total, deterministic

`crates/waggle-core/src/resolve.rs:45-64` — `resolve(manifest, ctx, now) -> Resolution`.

`resolve.rs:3-6` states invariant I-4 is enforced **by signature**: the function takes a manifest it was handed, a context, and a time value — "it cannot read a store, cannot write an event, cannot block a redirect. Recording is the host's separate, asynchronous act."

- `resolve.rs:50` — disposition first.
- `resolve.rs:51-54` — `Revoked` ⇒ `variant: None`; every other disposition runs the matcher.
- `resolve.rs:55-57` — freshness window from the variant, else `DEFAULT_REVALIDATE_MS` = 15 minutes (`resolve.rs:18`).
- `resolve.rs:58-63` — returns `Resolution { disposition, variant, as_of, revalidate_after }`.

Serving rules (`resolve.rs:40-43`): `Active` and `Expired` serve content; `Superseded` serves content **and** the pointer so late resolvers can follow it; `Revoked` serves nothing.

Disposition precedence — `manifest.rs:440-451`: revoked > superseded > expired > active.

---

## 2. Token lifecycle end-to-end

Flow: `mint` appends a `Minted` record and returns the token string, which is the only thing that travels. `resolve` selects a variant for the caller's context and appends a `resolve` event carrying the variant index. `read`/`search` return a budgeted slice and append a `read` event carrying the region-touch bitmask (and, for trees, the file ordinal). `record` appends a downstream stage. `coverage` folds that token's records into a verdict. `mutate` appends a lifecycle or cosmetic change.

**1. Mint.** `waggle-mcp/src/handlers.rs:154-247`.
- `handlers.rs:186-200` — a `--tree` mint routes to `mint_tree_indexed` before a flat token is created (minting a plain root first "would orphan a token").
- `handlers.rs:206` — calls `waggle_core::mint`.
- `handlers.rs:210-212` — if the host holds a signer, `trust::sign_manifest` is applied.
- `handlers.rs:213-218` — an 8-byte idempotency nonce is drawn from transport entropy (contract C-8).
- `handlers.rs:219-225` — `store.append(AppendIntent::Mint { manifest, nonce })`.
- `handlers.rs:230-238` — response carries `token`, `handoff`, `replayed`, `variants`.
- `waggle-mcp/src/map.rs:17-19` — `handoff_line(token)` = the string `resolve {token} via waggle for your working context`.

**2. Travel.** Only the token string enters the next agent's context. `README.md:65-70`: only the string enters the consumer's context; the artifact behind it never travels unless something fetches it. The token travels; the artifact never auto-expands.

**3. Resolve.** `handlers.rs:388-485`.
- `handlers.rs:404-411` — **ancestor revocation cascade** checked at resolve time: if any ancestor is revoked, a tombstoned clone is resolved instead.
- `handlers.rs:412` — `waggle_core::resolve`.
- `handlers.rs:417-428` — the resolve event is appended **at the transport layer**, honouring I-4 (core stays pure). `regions: None`, `entry: None` — a resolve touches no line range.
- `handlers.rs:434-440` — signature status (`valid` / `unsigned` / `INVALID`) rides every resolve response.
- `handlers.rs:445-453, 463-465` — a lineage root's projection includes its child index (token + target), which is how a folder token resolves on a machine where the folder never existed.

**4. Read / search.** `waggle-mcp/src/content_handlers.rs:298-417` (read), `:420+` (search).
- `content_handlers.rs:138` — `content_of()` prefers the mint-time snapshot blob, then the live local target.
- `content_handlers.rs:339-389` — lens dispatch: symbol, then lines, then section, then JSON pointer, else overview.
- `content_handlers.rs:409-410` — `span_bits(contract, result)` then `record_read(token, now, touched)`.
- `content_handlers.rs:395-404` — extraction provenance (`extracted_by`, `deterministic`) rides every serve of extracted text.

**5. Record.** `waggle-ops/src/lib.rs:148-163`. `lib.rs:152` states: append-only, there is no un-record; record a correcting stage instead.

**6. Coverage.** `waggle-mcp/src/lineage.rs:93-191` and `:324-383`.

**7. Mutate / lifecycle.** `waggle-core/src/log.rs:16-48` — the `Change` enum. `log.rs:50-59` — `is_lifecycle()` splits CAS-guarded lifecycle changes (`Revoked`, `Superseded`, `ExpirySet`) from LWW cosmetic ones (`CampaignSet`, `LabelSet`, `LabelUnset`). `manifest.rs:406-433` — `apply_change()` is THE single mutation semantic, shared by the fold, every backend, and reconstruct so they can never disagree. Lifecycle changes bump `version`; cosmetic ones do not.

---

## 3. The projector — the core idea

This is the "consumer-profile-aware projector." Its real mechanism is **sealed selection among pre-authored variants**, ranked by specificity — plus a separate byte-budget layer on the content tools.

### 3.1 Who is asking — `ResolverContext`

`crates/waggle-core/src/context.rs:30-46`. Five fields:

| Field | Line | Values |
|---|---|---|
| `kind` | `context.rs:33` | `Bot` / `Human` / `Terminal` / `Agent` (`context.rs:17-26`) |
| `model_family` | `context.rs:37` | `claude`, `gpt`, `gemini`, ... — **families only, never versions** |
| `harness` | `context.rs:40` | `claude-code`, `codex`, ... |
| `modalities` | `context.rs:43` | bitset: `TEXT`/`BROWSER`/`SHELL`/`VISION`/`AUDIO` (`manifest.rs:67-75`) |
| `posture` | `context.rs:45` | `Attended` / `Headless` / `Ci` (`manifest.rs:120-127`) |

`context.rs:104-125` — `negotiate()` turns a hint into a context. `ConsumerHint::Explicit` passes through unchanged; `ConsumerHint::UserAgent` is classified against `BOT_MARKERS` (`context.rs:85-96`) and `TERMINAL_MARKERS` (`context.rs:99`). `context.rs:102-103` and `:112-114` — **unknown user agents default to Human**, the safe default: disclosure, not projection.

### 3.2 What a variant claims — `MatchExpr`

`manifest.rs:144-158`. A conjunction over **four** dimensions: `model_family`, `harness`, `modalities`, `posture`. Each is a `Constraint` (`manifest.rs:134-140`): `Any` or `OneOf(Vec<String>)`.

- `manifest.rs:185-190` — `specificity()` = count of constrained dimensions, 0 to 4.
- `manifest.rs:169-171` — `MatchExpr::any()` is the catch-all.

### 3.3 The sealed matcher

`crates/waggle-core/src/matcher.rs:37-59` — `select_variant(variants, ctx) -> Option<Selected>`.

The normative algorithm, stated at `matcher.rs:10-16`:
1. a variant **matches** iff every constrained dimension accepts the context;
2. **specificity** = number of constrained dimensions (0 to 4);
3. highest specificity wins; **ties break by declaration order**;
4. mint guarantees a catch-all, so selection over minted manifests is total.

- `matcher.rs:44-48` — the comparison is **strictly greater**, so on a tie the earlier declaration stands.
- `matcher.rs:62-72` — `matches()` is a private function: model family AND harness AND modality-superset AND posture-membership.
- `matcher.rs:67` — modalities are **superset-matched**: the context must contain everything the variant requires.
- `matcher.rs:77-84` — `constraint_accepts()`: `Any` accepts everything; `OneOf` requires a *declared* value present in the set, compared case-insensitively (`matcher.rs:81`). An **undeclared** context value **fails** a constrained dimension — `matcher.rs:75-76` notes that a variant asking for `claude` must not serve an anonymous consumer.

**Sealed by construction** — `matcher.rs:3-8` states that selection is a private algorithm behind one free function: there is no trait to implement, no hook to override, no configuration that alters ranking. "Same context, same projection" is the trust claim agents depend on, so determinism must not be forkable. Expressiveness grows by adding dimensions to `MatchExpr` — a visible, versioned act — never by swapping algorithms.

`Selected` (`matcher.rs:25-30`) carries `index: u8` — the declaration-order position — which is exactly what `Event.variant` records, keeping the event manifest-referencing rather than payload-bearing.

### 3.4 Precision on "right-sized view at resolve time"

Two distinct mechanisms produce the right size, and only the first is the matcher:

1. **Variant selection** (`matcher.rs`) picks among projections an author wrote at mint. The projector does **not** synthesize or summarize content at resolve time — it selects a pre-authored body. `Variant.body` is either `Inline { content_type, data }` or `Media(MediaRef)` (`manifest.rs:197-207`).
2. **Byte budgeting** on the content tools does the actual slicing: `read`, `search`, and `query` all take `max-bytes`, **default 4096, floor 64** (`waggle-ops/src/lib.rs:212, 235, 253`). `read` never returns the whole artifact — `lib.rs:204` describes it as a line window, a markdown section, a code symbol, or a JSON pointer path, never the whole artifact, with every response fitting max-bytes and naming the bytes you avoided.

`Resolution` (`resolve.rs:21-35`) also carries `as_of` and `revalidate_after` — advisory, not a lease. `resolve.rs:16-17`: a resolution is knowledge, not a lease (G-3); this is the re-resolve-before-acting hint, not an enforcement mechanism.

---

## 4. The coverage contract

### 4.1 The log is append-only and payload-free — confirmed, by type

`crates/waggle-core/src/event.rs:126-157` — `struct Event`. `event.rs:124-125` states it plainly: **no payload field exists** — the type system, not policy, keeps recipient data out of analytics (I-1).

Fields recorded per access:

| Field | Line | Meaning |
|---|---|---|
| `token` | `event.rs:129` | which token |
| `stage` | `event.rs:131` | funnel stage (`resolve`, `read`, `run`, `repeat`, `accepted`, `rejected`, or a custom kebab slug) |
| `actor` | `event.rs:133` | `ActorClass` — coarse classes only |
| `at` | `event.rs:135` | timestamp |
| `seq` | `event.rs:137` | per-token monotonic, store-assigned |
| `variant` | `event.rs:141` | `Option<u8>` — which variant served a resolve |
| `regions` | `event.rs:148` | `Option<u8>` — contract region-touch bitmask |
| `entry` | `event.rs:156` | `Option<u32>` — file ordinal in a tree node's signed directory index |

The I-1 argument for `variant`, `regions`, and `entry` is that all three are **manifest-referencing**: `event.rs:143-146` — positions into a signed declaration, never bytes.

Actor coarsening is enforced at the boundary — `event.rs:66-95`, `ActorClass::from_context()` buckets `model_family` to `FamilyClass` (`event.rs:23-34`) and `harness` to `HarnessClass` (`event.rs:39-48`). `event.rs:200-211` is the test that proves it: a version string like `claude-fable-5.1-preview` buckets to `Other` — versions never survive. `event.rs:99-121` — `code()` packs kind (2 bits), family (3 bits), harness (3 bits) into a single byte.

**One stream, three record kinds.** `crates/waggle-core/src/log.rs:65-86` — `LogRecord` is `Minted { manifest }`, `Mutation { token, at, seq, change }`, or `Event(Event)`. `log.rs:2-4`: the manifest table anywhere in the system is a fold over this stream, rebuildable, never the truth. `log.rs:99-108` — `Minted` is always `Seq(0)`; birth precedes everything.

### 4.2 The contract — declared at mint, signed, non-renegotiable

`crates/waggle-core/src/contract.rs`.

- `contract.rs:19` — `MAX_CONTRACT_REGIONS = 8`. The cap exists because touches travel as a fixed-width `u8` bitmask (`contract.rs:9-12`).
- `contract.rs:22` — `FULL_COVERAGE_PERMILLE = 1000`.
- `contract.rs:26` — `MAX_LABEL_LEN = 80`.
- `contract.rs:59-66` — `Region { label, start, end }`, 1-based inclusive line ranges. Labels exist so misses can be *named*, not just numbered (`contract.rs:57-58`).
- `contract.rs:71-84` — `Region` deserializes through an unvalidated `RegionWire` and `TryFrom`, so an invalid range can never enter the domain.
- `contract.rs:133-136` — `Contract { regions, min_permille }`.
- `contract.rs:159-173` — validation: at least one region, at most 8, threshold in 1 to 1000.
- `contract.rs:142-148` — `min_permille` defaults to 1000 (full coverage) when omitted.

`contract.rs:1-5` states the design intent: the author's mint-time declaration of which regions of the artifact a consumer must actually reach, declared in the **immutable core** — because a contract you can re-negotiate after delegation is not a contract.

Signing proves it: `trust.rs:39` includes `contract` in `ImmutableCore`, and `trust.rs:264-291` is the test — tampering with the contract invalidates the signature. `trust.rs:36-37` and `:215-230` — an **absent** contract is skipped from serialization so pre-contract manifests keep byte-identical canonical bytes and existing signatures stay valid.

Authoring syntax — `waggle-ops/src/lib.rs:115`: `--require` accepts `lines:START-END`, `section:HEADING` (markdown), `symbol:NAME` (code, resolved against the mint-time symbol outline), or `files:all` (folder). `lib.rs:116` — `--min-coverage` is a fraction above 0 and at most 1, default 1.0. `contract_args.rs:24` — `TREE_ALL` is the literal `files:all`.

### 4.3 How touches are stamped

`contract.rs:191-199` — `touched_by_span(from, to)`: for each region in declaration order, if it overlaps the window, set bit `i`. `contract.rs:203-205` — `touched_by_line(line)` is `touched_by_span(line, line)`. `contract.rs:124-126` — overlap is `from <= end && to >= start`.

Call sites:
- `waggle-mcp/src/contract_args.rs:232-236` — `span_bits()` reads the served window off the result's `lines` field and converts it to bits. Used by `read` at `content_handlers.rs:409`.
- `contract_args.rs:239-248` — `match_bits()` ORs one touch per matched line for `search` hits.
- `content_handlers.rs:406-408` documents the boundary precisely: the served window on the line and section lenses is what touches contract regions; the overview and JSON lenses serve no ranged content, so they stamp nothing.
- `content_handlers.rs:275-294` — `record_read_entry()` appends an `AppendIntent::Event` at stage `read` carrying `regions` and `entry`.

### 4.4 How coverage is computed

**Fold, not a separate ledger.** `crates/waggle-core/src/fold.rs:128-142` — `RegionTouchFold` maps token to the **OR** of every event's `regions` bitmask. `fold.rs:123-127`: commutative and duplicate-tolerant by construction, since OR is both, so R-1 and R-3 hold without ceremony. Proven at `fold.rs:322-349` — shuffled and duplicated records give identical results.

`fold.rs:150-164` — `EntryTouchFold` does the same job for tree mints with a **union of file ordinals** in a `BTreeSet`; same commutativity and idempotence argument at `fold.rs:144-149`. Proven at `fold.rs:351-378`.

`fold.rs:17-20` — the `Fold` trait: `apply` performs no I/O and asks no clock; unknown record kinds must be ignored. `fold.rs:23-28` — tuple composition runs N folds in **one pass**. `fold.rs:31-36` — `replay()`.

Evaluation: `contract.rs:213-226` — `Contract::evaluate(bits)` returns a `Coverage` where `required` is the declared region count, `touched` is the count of set bits below `required`, `missed` is the indices of unset bits, `permille` is touched times 1000 divided by required using integer division so it floors, and `met` is permille at or above `min_permille`.

`Coverage` (`contract.rs:232-245`) carries `required`, `touched`, `permille`, `met`, and `missed` — described at `contract.rs:230-231` as the honest half: exactly which regions nobody touched.

The floor is deliberate and tested: `contract.rs:296-309` — 2 of 3 regions against a 667 threshold yields permille 666 and `met: false`, commented "permille floors, honestly."

**Three coverage paths** in `waggle-mcp/src/lineage.rs:93-191`:

1. `lineage.rs:107-109` — token has a `tree` node, so `tree_node_coverage()` (`:199-295`): BFS the node lineage; per node, union the `Event.entry` ordinals (`entries_touched`, `:310-318`) against the signed `DirIndex`; sum across the lineage. A per-**file** receipt with `first_missing` names (`:248-262`). Backstop 5000 nodes (`:218-220`).
2. `lineage.rs:116-120` — childless token with a contract, so `contract_coverage()` (`:324-383`): scan this token's records, `RegionTouchFold`, `contract.evaluate(bits)`, and **name** each miss with its label and line range (`:340-347`). Its `next` step is the exact `read` call that would close the first gap (`:350-356`).
3. `lineage.rs:127-154` — a flat lineage root, so BFS children and read each child's funnel via `child_consumption()` (`:27-36`), where any read or resolve counts as read and any run counts as run. Backstop 1000 (`:129-131`).

**`complete` vs `met`.** `lineage.rs:164-186` — `complete` (all files read) is always reported. `met` is only added when the mint declared `--require files:all` (`requires_all_files`, `:15-22`). The comment at `lineage.rs:181-185` draws the distinction: `complete` was a fact an orchestrator could consult; `met` is a verdict it can refuse an answer on.

`fold.rs:96-121` — `Outcome` is derived purely from accepted and rejected stage counts: `Pending`, `Accepted`, `Rejected`, or `Contested`. `fold.rs:317-319` — both verdicts surface honestly, never a silent overwrite.

An operational finding is recorded in the code itself — `lineage.rs:386-397`, the doc comment on `tree_coverage_next`: a model told to close an eleven-file gap one file at a time fetched them singly, exhausted its turns, and never answered, while the ungated arm holding the same correct answer was simply allowed to give it. The fix was to offer the fan-out call first (`lineage.rs:411-425`), on the stated principle that a refusal is only fair if the way to satisfy it is on the table.

---

## 5. Provenance and revocation

### 5.1 Provenance — four independent layers

**(a) Attribution fields**, in the signed core: `sharer` (`manifest.rs:310`, "who minted — attribution, independent of authorship"), `channel` (`:312`), `minted_at` (`:314`), `meta` (`:317`, a mint-time snapshot, never scraped — I-3).

**(b) Ed25519 signature over the immutable core.** `crates/waggle-core/src/trust.rs`.
- `trust.rs:23-43` — `ImmutableCore`, a **borrowed struct listing exactly the signed fields**. `trust.rs:21-22`: adding a mutable field here would break the "mutations never invalidate" property, and the compiler makes that a conscious act.
- `trust.rs:51-68` — `canonical_core_bytes()` is the `serde_json` encoding of that struct. Determinism is argued at `trust.rs:8-11`: every map in the core is a `BTreeMap` and field order is fixed by the struct.
- `trust.rs:92-99` — `sign_manifest()` returns a `SignatureBlock` of `alg: "ed25519"`, a hex 32-byte key, and a hex 64-byte signature (`manifest.rs:391-399`).
- `trust.rs:118-145` — `verify_manifest()` returns a three-valued `SignatureStatus` (`trust.rs:103-114`): `Unsigned`, `Valid { key }`, or `Invalid`. `trust.rs:101-102`: three-valued on purpose, because absent is not invalid and consumers choose their own policy.
- `trust.rs:194-212` — the payoff test: revoke plus label churn, and the signature is still `Valid`. The three-zone design means mutations do not touch what was signed.
- `trust.rs:175-184` — a pinned signature vector (fixed seed, fixed entropy, fixed clock, exact key), so a canonical-bytes break is caught.
- Key storage: `waggle-ops/src/lib.rs:372` — `~/.waggle/identity`, created by `waggle identity init`.
- Surfaced on every resolve: `handlers.rs:434-440`.

**(c) Lineage.** `manifest.rs:320` — `parent: Option<Token>`, set by `MintSpec::child_of` (`mint.rs:114-118`), part of the signed core (`trust.rs:31`). `fold.rs:168-185` — `LineageFold` builds parent-to-children in mint order, deduplicated.

**(d) Extraction provenance.** `manifest.rs:224-233` — `Extraction { media, extractor, deterministic }`. `manifest.rs:227-232` calls `deterministic` the load-bearing field: a PDF text-layer extraction reproduces exactly (`true`), while a model-produced OCR or ASR transcription is an opinion that drifts (`false`). `manifest.rs:222-223` — the substrate never *defaults* to a non-deterministic extractor. Set at `content_handlers.rs:103-110`; surfaced on every read at `content_handlers.rs:395-404`.

### 5.2 Revocation

Revocation is a **log record**, not a delete.

- `log.rs:19-20` — `Change::Revoked`, documented as withdrawing the token, a tombstone that cascades to children.
- `log.rs:54-59` — lifecycle, therefore CAS-guarded: `mutate` requires `expected-version` (`waggle-ops/src/lib.rs:174`) and fails with a conflict on mismatch (`lib.rs:170`).
- `manifest.rs:412-415` — `apply_change` sets `revoked_at` and bumps `version`.
- `manifest.rs:289-292` — `Disposition::Revoked { at }`, described as withdrawn, tombstoned, **never recycled** (I-6).
- `manifest.rs:440-443` — revocation outranks every other disposition. Tested at `manifest.rs:517-524`: revocation outranks supersession and expiry.
- `resolve.rs:51-53` — a revoked manifest yields no variant; **nothing is served**. Tested at `resolve.rs:126-129`.
- **Cascade** — `lineage.rs:41-55`, `ancestor_revoked_at()` walks the parent chain, depth-capped at 32, returning the first ancestor revocation. Applied at resolve time (`handlers.rs:404-411`) by cloning the manifest and applying `Change::Revoked` in memory. `lineage.rs:39-40`: revoking a folder or mission token tombstones everything minted under it — one revocation covers a whole tree (`waggle-ops/src/lib.rs:110`).
- **Irreversible by design** — `waggle-ops/src/lib.rs:177`: a supersede can itself be superseded; revocation is final.

**Supersession** is the softer sibling: `log.rs:22-25` — `Change::Superseded { by }`; `manifest.rs:293-297` — replaced by a corrected token, and late resolvers follow the pointer. `resolve.rs:41-42` — superseded still serves content **and** the pointer travels with it. Tested at `resolve.rs:117-125`.

**Expiry** — `manifest.rs:447-450` triggers when the expiry instant is at or before now, exclusive of earlier instants (`manifest.rs:505-508`). `resolve.rs:40-41` — expired still serves; expiry *policy* (redirect-with-warning versus tombstone) belongs to hosts.

---

## 6. The MCP surface

### 6.1 Single source of truth

`crates/waggle-ops/src/lib.rs:382-385` — `OPERATIONS` is the one catalog. `lib.rs:3-14`: four surfaces project from it and are forbidden to drift from it — MCP tool schemas, the clap CLI, the `map` tool's edges, and generated docs. `lib.rs:16-18`: the descriptions are written for agents first, because they are the MCP tool descriptions, which are the primary teaching surface.

`OperationSpec` (`lib.rs:75-95`) carries `name`, `surface`, `kind` (`DurableWrite`, `RelaxedWrite`, or `Read` — `lib.rs:42-49`), `description`, `args`, `forward` and `reverse` edges, and `core_fn` — the fully-qualified core function the schema-to-signature parity test pins it to.

`crates/waggle-mcp/src/rpc.rs:22-46` — `tool_list()` generates the MCP schema from the catalog: every `Surface::Both` operation, each arg emitted with type string and the arg doc as its description, and `required` collected from the arg's `required` flag. **All MCP arg types are strings.**

Wire layer: `rpc.rs:17` — `PROTOCOL_VERSION` is `2024-11-05`. `rpc.rs:131-146` — the methods are `initialize`, `tools/list`, `tools/call`, and `ping`. `rpc.rs:142` — the server identifies as `waggled`. `rpc.rs:1-6`: deliberately minimal, and the shim can add no semantics because there are none there to add.

Dispatch: `waggle-mcp/src/handlers.rs:119-152`. Unknown tools return an error that points at `map` (`handlers.rs:143-150`).

### 6.2 The eleven MCP tools (`Surface::Both`)

| Tool | Kind | Required args | Optional args | `core_fn` |
|---|---|---|---|---|
| `mint` (`lib.rs:98-124`) | DurableWrite | `target` | `sharer`, `channel`, `parent`, `snapshot`, `private`, `tree`, `tag`, `content`, `attach`, `attach-type`, `require`, `min-coverage` | `waggle_core::mint` |
| `resolve` (`lib.rs:127-145`) | Read | `token` | `context`, `level` (eventual or strict) | `waggle_core::resolve` |
| `record` (`lib.rs:148-163`) | RelaxedWrite | `token`, `stage` | none | `waggle_core::event` |
| `mutate` (`lib.rs:166-179`) | DurableWrite | `token`, `change` | `expected-version` | `waggle_core::mutate` |
| `funnel` (`lib.rs:182-197`) | Read | `token` | none | `waggle_store::ReadStore::funnel` |
| `read` (`lib.rs:200-222`) | RelaxedWrite | `token` | `lines`, `section`, `file`, `symbol`, `path`, `max-bytes` | `waggle_mcp::content::read` |
| `search` (`lib.rs:225-242`) | RelaxedWrite | `token`, `pattern` | `context`, `max-matches`, `max-bytes` | `waggle_mcp::content::search` |
| `query` (`lib.rs:245-258`) | Read | `token` | `path`, `max-bytes` | `waggle_mcp::query::slice_at` |
| `find` (`lib.rs:278-289`) | Read | `query` | none | `waggle_mcp::handlers::find` |
| `coverage` (`lib.rs:261-275`) | Read | `token` | none | `waggle_mcp::lineage::coverage` |
| `map` (`lib.rs:292-305`) | Read | none | `token` | `waggle_core::map` |

Note that `read` and `search` are `RelaxedWrite`, not `Read` — because they append the `read` stage event that makes coverage possible.

### 6.3 The five CLI-only operations

`init` (`lib.rs:338-349`), `serve` (`lib.rs:308-320`), `daemon` (`lib.rs:323-335`), `edge` (`lib.rs:352-365`), `identity` (`lib.rs:368-379`).

### 6.4 The envelope — self-teaching responses

Every handler returns an `Envelope` (`waggle-mcp/src/envelope.rs`) carrying the result, a `next` list, and `Stats`. A `NextCall` is a tool name, pre-filled args, and a one-sentence `why`. Examples: `handlers.rs:229` (mint points to resolve and map), `lineage.rs:350-356` (coverage points to the exact read that closes the first gap), `discovery.rs:88-95` (find points to resolving the newest candidate).

`waggle-ops/src/lib.rs:444-466` — a test walks forward edges from `map` and requires **every** both-surface operation to be reachable, so an agent can discover the whole surface from one call.

`find` is deliberately non-authoritative — `discovery.rs:1-4`: names as LOOKUP, tokens as IDENTITY. `lib.rs:282`: you choose which token to resolve; a name never resolves by itself. Implementation `discovery.rs:40-108`: case-insensitive substring over target basename, channel, sharer, and labels; newest first; top 10; disposition always shown so a dead name is visibly dead.

---

## 7. Claims about token savings — corrected

### 7.1 The ~15x figure is NOT waggle's savings

`README.md:46-50` reads: the costs are measured, not hypothetical; multi-agent systems consume roughly 15x the tokens of a chat session, an overhead attributed by the vendor itself to duplicating context across agents and summarizing results for handoffs, whose one-line summary is "each handoff loses context"; and roughly 37% of multi-agent failures trace to exactly this seam.

`docs/WHY.md:28-31` gives the attribution: Anthropic, engineering their own multi-agent research system, measured agents at roughly **4x** the tokens of chat and multi-agent systems at roughly **15x**, and wrote the sentence this project is built on, "each handoff loses context."

**This is the size of the problem, measured by Anthropic — not a reduction delivered by waggle.**

### 7.2 The ~37% figure is MAST, and it is about misalignment

`docs/WHY.md:32-35`: the **MAST** failure taxonomy (Berkeley) attributes **36.9%** of multi-agent system failures to inter-agent misalignment — agents acting on divergent, stale, or partial copies of what should have been the same information.

`README.md:50` rounds this to "roughly 37%." `WHY.md:57` adds that MAST's 36.9% "has a mailing address." **The precise figure is 36.9%, and the source category is "inter-agent misalignment"; framing it as "the handoff seam" is the repo's argument, not the source's own wording.**

### 7.3 A coincidental near-collision worth flagging

`paper/generated/tier2.tex` defines a macro whose value is **37.9%** — the **false-negative rate of a side-door coverage receipt** in waggle's own Tier-2 benchmark (400 trials, 3-region contract, 25% bluffers; sealed FNR 6.2%, coverage-ROC AUC 0.903). This 37.9% is unrelated to MAST's 36.9% and should not be conflated with it.

### 7.4 What waggle actually measures for itself

`paper/generated/cost_table.tex` — handoff cost in tokens against a **cached** copy baseline (tokenizer char-ratio/4.0, cache discount 0.1; the caption states the ratio is tokenizer-invariant):

| Scenario | copy (cached) | waggle | ratio |
|---|---|---|---|
| single, one turn | 1,024 | 520 | 2.0x |
| fan-out, few turns | 36,864 | 1,604 | 23.0x |
| paper cell | 122,880 | 2,785 | 44.1x |
| deep delegation | 2,007,040 | 6,095 | 329.3x |

`paper/generated/tier3_gate.tex` — 12 artifact shapes by 9 models by 4 turn-matched arms, 1,704 paired runs. The aggregate row: copy 97% ok at 81,666 ingest; reference 90% at 5,491; waggle 96% at 2,579; waggle-plus-gate 99% at 2,761. That is roughly **31.7x fewer artifact bytes ingested** than copy at comparable accuracy.

The caption is notably restrained: read the table for the shape of the failures, not for a winner. Against the paste, the token ties (13 paired wins to 15) at a thirty-second of the context; against a raw path given `pdftotext` and `ls`, so a fair baseline, it wins 34 to 9. It names two rows against itself: `bigtree_count`, where a copy holding all 310 KB counts correctly only 61% of the time, and `reasoning`, where the repo says its own gate makes things worse (94% down to 88%).

`README.md:72-99` concedes the shared-filesystem case outright: the `reference` arm (a local path plus `ls`, `grep`, `open`, `pdftotext`) scores **90%**, competitive with waggle's 96%, and if your agents are local, the task is short, and you never need to audit anything, use the path — waggle is overhead. `README.md:84-88` names the sharpest result — regions read gives 99% correct, skipped gives 20% — and says it exists only because reads go through the token.

### 7.5 The "~30-byte token" claim

`README.md:103` says a token is a roughly 30-byte attributed name for an artifact, minted in one call. `README.md:36` (hero alt text) says "a 30-byte token."

**Neither matches any literal size in the code.** The actual sizes:

| Measure | Value | Source |
|---|---|---|
| Rust struct in memory | **exactly 24 bytes** | `token.rs:44-47`, asserted `token.rs:181` |
| Default minted string | **8 characters** | `mint.rs:41` |
| Private (capability) string | **16 characters** | `mint.rs:240` |
| Maximum legal string | 23 characters | `token.rs:21` |
| The handoff line an agent pastes | about 58 bytes | `map.rs:17-19` |

"~30 bytes" is a **rhetorical size class**, and the README says so at `README.md:53-54`: a path is a 30-byte reference, which is exactly the right size for a handoff. The token is being placed in the same size class as a filesystem path, not measured.

### 7.6 Correction summary

| Prior claim | Verdict | Actual |
|---|---|---|
| "immutable ~30-byte token" | **Partly wrong on size** | Immutable: yes. Size: a 24-byte struct and an 8-character string (16 when private). "~30 bytes" is a rhetorical comparison to a path, not a measurement. |
| "opaque or structured?" | **Fully opaque** | Rejection-sampled base58 randomness with zero embedded structure — a name, not data (`token.rs:40-41`). |
| "~15x burn reduction" | **Misattributed** | 15x is Anthropic's measurement of multi-agent token *overhead* — the problem, not the fix. Waggle's own measured ratios are 2.0x to 329.3x (`cost_table.tex`) and about 31.7x fewer ingested bytes (`tier3_gate.tex`). |
| "~37% of failures at handoff seams" | **Close; source is MAST** | 36.9%, Berkeley MAST taxonomy, category "inter-agent misalignment" (`WHY.md:32-35`). "Handoff seam" is the repo's framing. |
| "append-only, payload-free log" | **Confirmed, by type** | `event.rs:124-125` — no payload field exists. One stream carries `Minted`, `Mutation`, and `Event` (`log.rs:65-86`). |
| "coverage contract = proof a section was read" | **Confirmed** | A signed mint-time region declaration, an OR-fold of region bits, and a `met` verdict with **named** misses (`contract.rs`, `fold.rs:128-142`, `lineage.rs:324-383`). |
| "consumer-profile-aware projector" | **Confirmed, with precision** | It **selects among pre-authored variants** by specificity over four dimensions; it does not synthesize a view. The actual right-sizing comes from the separate max-bytes budget layer (default 4096). |

---

## 8. Lift notes: mapping to the Spectrum stage-walk + the Griot-Wide Workgraph

> Vocabulary note: **Spectrum** is our methodology; ICM is the upstream academic methodology Spectrum derives from. Waggle is an independent Rust project and makes no reference to either.

### 8.1 Why this is the highest-value graft

The Spectrum stage-walk already has the shape waggle formalizes. A Spectrum stage contract (`.prism/shared/plans/<date>-<stage>-CONTEXT.md`) declares **Inputs — Working vs Reference**, with the standing instruction that Reference material is pulled via code-intel and not inlined. That instruction is a **convention with no enforcement** — precisely the soft-fix class. Waggle's contribution is that the same distinction is enforced **by type**: `Event` has no payload field, so a reference cannot silently become a copy, and `coverage` can prove after the fact which declared regions a stage actually reached.

Three Spectrum and workgraph gaps map one-to-one onto waggle mechanisms:

| Spectrum gap today | Waggle mechanism | Where |
|---|---|---|
| A handoff doc is pasted or re-read whole; no record of which sections were used | Region contract plus OR-fold of region-touch bits | `contract.rs:191-226`, `fold.rs:128-142` |
| Whether the next stage actually read the contract is unanswerable | `coverage` returning `met` plus **named** misses | `lineage.rs:324-383` |
| A superseded plan leaves stale copies in sibling sessions | `supersede`, where late resolvers follow the pointer | `resolve.rs:41-42`, `manifest.rs:293-297` |
| Cross-workspace edges are prose in a handoff file | `parent` link in the signed core plus `LineageFold` | `manifest.rs:320`, `fold.rs:168-185` |

### 8.2 A handoff as a cross-workspace edge

In the Griot-Wide Workgraph, a handoff between workspaces is an **edge**. Waggle gives that edge a first-class identity with four properties the current prose handoff lacks:

1. **An identity** — the token. Not a path (`README.md:93-94` notes that a `file://` URI means nothing to an agent in another container or at the edge) and not a heading. `manifest.rs:320` puts `parent` in the signed core, so the graph structure itself is tamper-evident.
2. **A direction and a lineage** — `LineageFold` (`fold.rs:168-185`) reconstructs the parent-to-children forest from `Minted` records alone. The workgraph cross-workspace edges are exactly this forest.
3. **A revocation cascade** — `lineage.rs:41-55` plus `handlers.rs:404-411`. Revoking a parent tombstones the whole subtree **at resolve time**. In workgraph terms: invalidating an upstream stage automatically invalidates every downstream stage that depended on it, with no sweep required.
4. **Reach across surfaces** — the same token resolves at three radii (`README.md:279-285`): the local daemon, daemon-to-daemon federation, and a Cloudflare Durable Object per tenant. This is the property that makes a cross-workspace edge meaningful rather than a local-filesystem convention. Migration between radii is replaying the log (`README.md:279`).

### 8.3 A stage contract declaring Inbound (awaits)

The natural lift: a Spectrum stage contract `Inbound (awaits):` block becomes a list of **tokens carrying coverage contracts**, not a list of file paths.

Today the contract says: Inputs — Working (this run, exact paths); Inputs — Reference (pull via code-intel, do not inline).

Lifted, the same block names a token plus its required sections and a coverage threshold — for example an inbound token requiring the Decisions section and the Success-criteria section at full coverage.

Mechanically this is exactly `mint --require section:HEADING --min-coverage 1.0` (`waggle-ops/src/lib.rs:115-116`), and the closing gate is `coverage` returning met (`lineage.rs:373`). Notes on the fit:

- **The contract is signed and non-renegotiable.** `contract.rs:3-5`: a contract you can re-negotiate after delegation is not a contract. A downstream stage cannot lower the bar it was handed. This is exactly the property that distinguishes an invariant from a preference in our own vocabulary, and here it is enforced by `trust.rs:264-291`, where tampering with the contract invalidates the signature.
- **`met` is a gate; `complete` is a fact.** `lineage.rs:181-185`. A closing ceremony wants `met` — a verdict it can halt on — and that requires the contract to have been declared **at mint**. A stage-walk that mints without `--require` gets a fact it can consult, not a gate it can enforce.
- **The misses are named, not counted.** `lineage.rs:340-347` returns region index, label, and line range per miss, and the next step is the exact `read` call that closes the first gap (`:350-356`). A stage that fails its inbound contract is told which section it skipped, by heading.
- **Eight regions maximum** (`contract.rs:19`). A stage contract with more than eight required sections must merge adjacent ranges; the error text says so (`contract.rs:35`).
- **`files:all` for whole-directory awaits** (`contract_args.rs:24`, `waggle-ops/src/lib.rs:110`) — one mint covers a folder of thousands, and one revocation covers the tree.

### 8.4 The projector maps onto our model routing

The four matched dimensions of `ResolverContext` (`context.rs:30-46`) line up with routing decisions we already make. `model_family` and `harness` are the Opus/Sonnet/Haiku and Claude-Code/Codex/Cowork axes; `posture` (`Attended`, `Headless`, `Ci` — `manifest.rs:120-127`) is exactly the interactive-versus-headless distinction that governs whether a run may call `AskUserQuestion`.

The lift: one handoff token could carry a full-fidelity variant for an Opus planning pass and a compressed variant for a Haiku locator pass, selected deterministically at resolve time with no orchestrator branching. The `Headless` posture variant is the natural home for the proceed-autonomously instruction that currently has to be repeated in every thin router prompt.

Two constraints to carry forward:
- **Variants are authored at mint, not generated at resolve** (`manifest.rs:328`, `mint.rs:283-295`). The projector selects; it does not summarize. Right-sizing beyond variant choice comes from max-bytes on `read`, `search`, and `query` (`waggle-ops/src/lib.rs:212, 235, 253`).
- **An undeclared context value fails a constrained dimension** (`matcher.rs:75-84`). A caller that does not declare `model_family` gets the catch-all, never the Claude-specific variant. Any lift must pass an explicit context or accept the catch-all.

### 8.5 The invariant framing

Waggle is, in our vocabulary, a repo built almost entirely of hard forms. Worth noting as precedent:

- **I-1 (payload-free) is enforced by the type system**, not policy — `event.rs:124-125` names the choice explicitly.
- **I-4 (resolve does no I/O) is enforced by the function signature** — `resolve.rs:3-6` says the invariant holds "by signature."
- **The signed zone is enforced by a separate struct** — `trust.rs:21-22`: adding a mutable field there would break the property, and the compiler makes that a conscious act.
- **Determinism is enforced by sealing** — `matcher.rs:3-8`: no trait, no hook, no configuration; determinism must not be forkable.
- **Surface drift is enforced by parity tests** — `waggle-ops/src/lib.rs:3-14`, plus `lib.rs:444-466` (every tool reachable from `map`) and `OperationSpec::core_fn` (`lib.rs:93-94`) pinning each schema to a core signature.

Each of these takes a rule that would otherwise live in a doc comment and gives it a mechanical checker — the same move our invariant table makes, applied at the type level rather than at the ceremony gate.

### 8.6 Honest limits of the graft

- Waggle is Rust plus an MCP server (`waggled`); adopting it means running a daemon (`waggle-ops/src/lib.rs:308-320`) and wiring it per-harness (`lib.rs:342` gives the `claude mcp add` line).
- Its own README argues against adoption for the purely-local, short-task, no-audit case (`README.md:76-79`).
- The `reasoning` benchmark row shows the coverage gate making accuracy **worse** (94% down to 88%, `tier3_gate.tex`) — a gate is not free.
- `MAX_CONTRACT_REGIONS = 8` (`contract.rs:19`) is a hard structural cap driven by the `u8` bitmask width.
- Contract regions are **line ranges resolved at mint** (`contract_args.rs:45` onward). A `section:` requirement is resolved to lines against the mint-time snapshot; if the underlying file later changes, the snapshot is still what is served (`content_handlers.rs:138`, snapshot blob first), so the contract stays pinned to the bytes that existed at mint.

---

## Appendix: file index

| File | What lives there |
|---|---|
| `crates/waggle-core/src/token.rs` | Token type, base58 alphabet, rejection sampling |
| `crates/waggle-core/src/mint.rs` | `MintSpec` builder, `mint()`, catch-all synthesis |
| `crates/waggle-core/src/manifest.rs` | `AttributionManifest`, `Variant`, `MatchExpr`, `Disposition`, `apply_change` |
| `crates/waggle-core/src/matcher.rs` | The sealed variant matcher — the projector |
| `crates/waggle-core/src/context.rs` | `ResolverContext`, `negotiate()` |
| `crates/waggle-core/src/resolve.rs` | `resolve()`, `Resolution` |
| `crates/waggle-core/src/contract.rs` | `Region`, `Contract`, `Coverage`, `evaluate()` |
| `crates/waggle-core/src/event.rs` | `Event` (payload-free), `ActorClass` coarsening |
| `crates/waggle-core/src/log.rs` | `LogRecord`, `Change`, lifecycle/cosmetic split |
| `crates/waggle-core/src/fold.rs` | `Fold` trait, `RegionTouchFold`, `EntryTouchFold`, `LineageFold`, `outcome_of` |
| `crates/waggle-core/src/trust.rs` | `ImmutableCore`, Ed25519 sign and verify |
| `crates/waggle-ops/src/lib.rs` | The operations catalog — all 16 operations |
| `crates/waggle-mcp/src/rpc.rs` | JSON-RPC wire layer, `tool_list()` |
| `crates/waggle-mcp/src/handlers.rs` | `dispatch`, `mint`, `resolve`, `mutate`, `funnel`, `map` |
| `crates/waggle-mcp/src/content_handlers.rs` | `read`, `search`, snapshot, extraction, `record_read` |
| `crates/waggle-mcp/src/contract_args.rs` | require-flag parsing, `span_bits`, `match_bits` |
| `crates/waggle-mcp/src/lineage.rs` | `coverage` — tree, contract, and flat-lineage paths |
| `crates/waggle-mcp/src/discovery.rs` | `find` |
| `crates/waggle-mcp/src/map.rs` | `handoff_line`, global and token map |
| `README.md`, `docs/WHY.md` | The 15x and 36.9% citations |
| `paper/generated/cost_table.tex`, `tier3_gate.tex`, `tier2.tex` | Measured results |
