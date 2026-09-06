---
date: 2026-09-06
topic: Puter cross-app interop / IPC bus — mechanism at file:line precision
source_repo: C:\Users\digit\GriotSandbox\xplatform-harvest\puter
purpose: lift the pattern into Prism's broker + digital-griot-mcp channel
status: documentarian (describes what exists)
---

# Puter cross-app interop / IPC bus

All paths below are relative to `C:\Users\digit\GriotSandbox\xplatform-harvest\puter`.

Two halves:

- **GUI side (the "kernel")** — `src/gui/src/`. Runs in the top-level Puter document. Owns the
  registries, mints the connection UUIDs, validates every inbound message.
- **App side (the SDK)** — `src/puter-js/src/`. Runs inside each app's `<iframe>`. Builds the
  envelopes and exposes `AppConnection`.

There is no server component in this path. The whole bus is `window.postMessage` between the
top-level document and its app iframes; the GUI is the only router — apps never postMessage each
other directly.

---

## Mechanism

### 0. The four registries

| Registry | Where | Type | Keyed by | Holds |
|---|---|---|---|---|
| `window.app_instance_ids` | `src/gui/src/globals.js:29` | `Set` | real instance uuid | every launched app instance; the **admission list** |
| `ProcessService.processes_map` | `src/gui/src/services/ProcessService.js:31` | `Map` | real instance uuid | the `Process` object (`PortalProcess` / `PseudoProcess` / `InitProcess`) |
| `ProcessService.uuid_to_treelist` | `src/gui/src/services/ProcessService.js:32` | `Map` | real instance uuid | array of child processes (the process tree) |
| `IPCService.connections_` | `src/gui/src/services/IPCService.js:52` | `Map` | **pseudo** uuid | the connection record (`{source, target, uuid, reverse}`) |

The DOM is a fifth, implicit registry: the `.window[data-element_uuid="<uuid>"]` element and its
`.window-app-iframe` child are resolved by `window.window_for_app_instance` /
`window.iframe_for_app_instance` (`src/gui/src/helpers.js:3434-3441`). `Process.references.iframe`
is a live getter over that lookup (`src/gui/src/definitions.js:83-89`) — it is never a cached
element handle.

`connections_` is deliberately a `Map` and not an object. The comment at
`src/gui/src/services/IPCService.js:47-51` states why: lookups are keyed by a uuid an app sends
in `messageToApp`, and on a plain object `constructor` / `__proto__` would resolve to an
`Object.prototype` member, which would then be treated as a live connection *and* have the cached
instance written onto it. `src/gui/src/services/IPCService.test.js:72-80` locks that behaviour in
for `__proto__`, `constructor`, and `toString`.

### 1. Where the paired UUIDs are minted — CONFIRMED, with a correction

**`IPCService.add_connection` — `src/gui/src/services/IPCService.js:55-73`.**

```
add_connection ({ source, target }) {
    const uuid   = window.uuidv4();     // :56
    const r_uuid = window.uuidv4();     // :57
    const forward  = { source, target, uuid: uuid,   reverse: r_uuid };  // :58-63
    const backward = { source: target, target: source, uuid: r_uuid, reverse: uuid }; // :64-69
    this.connections_.set(uuid,   forward);    // :70
    this.connections_.set(r_uuid, backward);   // :71
    return { forward, backward };              // :72
}
```

Two v4 UUIDs, two records, both inserted into the same `Map`, each record naming the other's uuid
as its `reverse`. **Prior research is correct that a `(forward, backward)` pair is minted and each
side receives exactly one of the two.** Three corrections / clarifications:

1. **These are not the app instance IDs.** They are *pseudo-IDs* — routing aliases. The child's
   real instance uuid is minted separately at `src/gui/src/services/ExecService.js:56`
   (`const child_instance_id = window.uuidv4();`) and is what goes into
   `window.app_instance_ids`, `processes_map`, and the iframe's
   `?puter.app_instance_id=` query param (`src/gui/src/helpers/launchApp.js:441`). A parent that
   launched a child through IPC **never learns the child's real instance uuid** — it is handed
   `connection.forward.uuid` in the slot named `appInstanceID`
   (`src/gui/src/services/ExecService.js:245-246`).
2. **Minting is not unconditional at launch.** `ExecService.launchApp` only calls `add_connection`
   when there is an IPC caller: `const connection = ipc_context ? svc_ipc.add_connection({...}) :
   undefined;` (`src/gui/src/services/ExecService.js:59-62`). A launch from the desktop/taskbar
   (`launch_app()` called directly, no `ipc_context`) mints **no** connection pair; the parent slot
   falls back to the raw `child_instance_id` (`src/gui/src/services/ExecService.js:246`). Apps
   launched outside `ExecService` entirely (`src/gui/src/helpers/launchApp.js` called directly)
   never touch `IPCService` at all.
3. **There is a second minting site**, not at launch: `ExecService.connectToInstance`
   (`src/gui/src/services/ExecService.js:275-278`) mints a pair to attach a caller to an
   *already-running* process.

**Who gets which half:**

- Parent (the launcher) receives `connection.forward.uuid` — returned as the `appInstanceID` field
  of the `launchApp` IPC result (`src/gui/src/services/ExecService.js:244-249`), which the SDK
  feeds into `AppConnection.from(...)` as `values.appInstanceID` -> `this.targetAppInstanceID`
  (`src/puter-js/src/modules/UI.js:314-320`, `:336`).
- Child receives `connection.backward.uuid` — passed as `launch_options.parent_pseudo_id`
  (`src/gui/src/services/ExecService.js:107-109`), stamped into the child iframe URL as
  `?puter.parent_instance_id=` (`src/gui/src/helpers/launchApp.js:448-449`), read back by the SDK
  at `src/puter-js/src/index.js:552-554` into `parentInstanceID`, and used to build the child's
  parent-facing `AppConnection` (`src/puter-js/src/modules/UI.js:587-594`).

Note the field-name asymmetry at `src/gui/src/helpers/launchApp.js:448-449`: the *presence* check
is on `options.parent_instance_id` (the real parent uuid, also used for the process tree at
`src/gui/src/helpers/launchApp.js:414` and for the `data-parent_instance_id` DOM attribute) while
the *value* appended to the URL is `options.parent_pseudo_id`.

For `connectToInstance` the same split applies: the target process is handed
`connection.backward` (`src/gui/src/services/ExecService.js:280`), the caller gets
`connection.forward.uuid` (`:283`).

### 2. The message envelope — VERIFIED, one field missing from prior research

There is not one envelope, there are **four distinct shapes** on this bus.

**(a) The v2 typed IPC call — SDK -> GUI.** `src/puter-js/src/modules/UI.js:544-552`:

```
{ $: 'puter-ipc', v: 2, appInstanceID, env, msg: method, parameters, uuid: callback_id }
```

Prior research listed `{$:'puter-ipc', v, msg, appInstanceID, uuid, parameters}` — correct on every
field it names, but it **omits `env`**, which is load-bearing: `ipc_listener` reads `env` first and
drops anything that is not `'app'` (`src/gui/src/IPC.js:64-70`). Field meanings:

| Field | Meaning | Set at |
|---|---|---|
| `$` | type tag, literal `'puter-ipc'`. Its *presence* is the version discriminator | `src/puter-js/src/modules/UI.js:545` |
| `v` | envelope version, literal `2` | `:546` |
| `appInstanceID` | the **sender's own** real instance uuid (from `?puter.app_instance_id=`) | `:547`, sourced `src/puter-js/src/index.js:544-548` |
| `env` | `'app'` or `'gui'`; the GUI's own puter instance short-circuits at `src/puter-js/src/modules/UI.js:583-585` and has no `messageTarget` | `:548` |
| `msg` | the handler name to dispatch (`'launchApp'`, `'connectToInstance'`, ...) | `:549` |
| `parameters` | the handler's argument object | `:550` |
| `uuid` | the **reply correlation id** — a `CallbackManager` id, an incrementing integer, *not* a UUID | `:551`, minted `src/puter-js/src/lib/xdrpc.js:44-48` |

**(b) The v1 / legacy flat envelope — SDK -> GUI.** `#postMessageWithCallback`
(`src/puter-js/src/modules/UI.js:498-511`) posts `{ msg, env, appInstanceID, uuid: msg_id,
...args }` — arguments splatted at the top level, no `$`, and `uuid` here is a *different*
counter (`#messageID`, `src/puter-js/src/modules/UI.js:457`, `:499`). The GUI normalises these into
shape (a) in place at `src/gui/src/IPC.js:130-138`: if `event.data.$ === undefined`, it sets
`$ = 'puter-ipc'`, `v = 1`, and rebuilds `parameters` as a shallow copy of `event.data` minus
`msg`, `appInstanceId`, `env`, and `uuid`.

Several SDK messages ride shape (b) with no `env` at all — `READY`
(`src/puter-js/src/modules/UI.js:598-601`), `windowFocused` (`:605-608`), `mouseMoved` (`:912-917`),
`mouseClicked` (`:927-932`), `messageToApp` (`:410-419`), `closeApp` (`:435-439`). Those are
admitted because `src/gui/src/IPC.js:64` defaults a missing `env` to `'app'`.

**(c) The app-to-app envelope.** `AppConnection.postMessage`
(`src/puter-js/src/modules/UI.js:410-419`):

```
{ msg: 'messageToApp', appInstanceID, targetAppInstanceID, targetAppOrigin: '*', contents }
```

`appInstanceID` = sender's real uuid; `targetAppInstanceID` = the pseudo-uuid the sender holds;
`contents` = the opaque user payload. The GUI's re-emission toward the target is built by
`PortalProcess.send` (`src/gui/src/definitions.js:165-174`) and carries
`appInstanceID: channel.returnAddress` (the *reverse* pseudo-uuid) and `targetAppInstanceID:
this.uuid` (the recipient's real uuid).

**(d) The out-of-band `$SCOPE` reply channel.** Replies to shape (a)/(b) calls do **not** use
`msg`. `UtilRPC.send` posts `{ $SCOPE, id, args }` (`src/puter-js/src/modules/Util.js:67-69`) where
`$SCOPE` is the fixed literal `'9a9c83a4-7897-43a0-93b9-53217b84fde6'`
(`src/puter-js/src/lib/xdrpc.js:7`). `CallbackManager.attach_to_source`
(`src/puter-js/src/lib/xdrpc.js:50-61`) matches on `data.$SCOPE === $SCOPE` and invokes the stored
callback by `id`. Functions inside a payload survive the frame boundary because `Dehydrator`
replaces each function with `{ $SCOPE, id }` (`src/puter-js/src/lib/xdrpc.js:77-92`) and `Hydrator`
turns those back into stubs that post to the far side (`:107-126`). Both rebuild objects with
`Object.defineProperty` rather than `result[key] = value`, so a literal `__proto__` key in a
message cannot hit `Object.prototype`'s setter (`src/puter-js/src/lib/xdrpc.js:9-30`).

There is also a fifth, tiny shape used only for the connection handshake: `{ $: 'connection-resp',
connection, accept, value }` (`src/puter-js/src/modules/UI.js:880-894`). The comment at
`src/gui/src/definitions.js:181-182` says it uses `$` instead of `msg` specifically to avoid being
picked up by `IPC.js`.

### 3. How `appInstanceID` is validated on every message

The whole gate is `src/gui/src/IPC.js:63-112`, in order:

1. `src/gui/src/IPC.js:64-70` — `env` must be `'app'` (missing defaults to `'app'`); anything else
   resolves `handled` false and returns.
2. `src/gui/src/IPC.js:75-83` — if `event.data.original_msg_id` names a live entry in
   `window.appCallbackFunctions`, this is a *reply* to a GUI-initiated message: fire the callback,
   delete it, return. Replies bypass the instance-ID checks entirely.
3. `src/gui/src/IPC.js:90-92` — `event.data` and `event.data.msg` must both be truthy.
4. `src/gui/src/IPC.js:95-97` — `appInstanceID` must be present. Missing -> `console.error
   ('appInstanceID is needed')`, `handled.resolve(false)`, return.
5. `src/gui/src/IPC.js:98-101` — **the live-registry lookup**: `window.app_instance_ids.has(
   event.data.appInstanceID)`. This is a `Set` of strings, created at
   `src/gui/src/globals.js:29`, written at exactly one place —
   `src/gui/src/helpers/launchApp.js:572` (`window.app_instance_ids.add(uuid)`), inside the
   non-explorer launch branch, before the iframe is created. Failure -> `console.error(
   'appInstanceID is invalid')`, `handled.resolve(false)`, return. **No reply is sent**, so the
   caller's promise never settles.
6. `src/gui/src/IPC.js:106-110` — the iframe-identity gate (see section 4).

Only after all six does `handled.resolve(true)` run (`src/gui/src/IPC.js:112`) and dispatch begin.

Downstream, the same id is resolved twice more: to a DOM window/iframe
(`src/gui/src/IPC.js:114-120`) and to a `Process` via
`svc_process.get_by_uuid(event.data.appInstanceID)` (`src/gui/src/IPC.js:142`, and again for
`READY` at `:179`). `ProcessService.get_by_uuid` is a bare `processes_map.get(uuid)`
(`src/gui/src/services/ProcessService.js:57-59`) and returns `undefined` for an unregistered id.

Note the **asymmetry that makes the pseudo-IDs work**: only `event.data.appInstanceID` (the
sender's own id) is checked against `app_instance_ids`. `targetAppInstanceID` is *not* — it is
looked up in `IPCService.connections_` (`src/gui/src/IPC.js:2059`), which is keyed by the
unguessable pseudo-uuids. A pseudo-uuid is never a member of `app_instance_ids`, and a real
instance uuid is never a key in `connections_`.

### 4. The iframe-identity gate

`src/gui/src/IPC.js:103-110`:

```
// The sender must be the iframe that owns this appInstanceID — instance
// IDs are disclosed to other apps (e.g. via `messageToApp`), so knowing
// one must not be enough to act as that app.
const owner_iframe = window.iframe_for_app_instance(event.data.appInstanceID);
if ( ! owner_iframe || event.source !== owner_iframe.contentWindow ) {
    console.error('appInstanceID does not match message source');
    return handled.resolve(false);
}
```

`window.iframe_for_app_instance` (`src/gui/src/helpers.js:3439-3441`) resolves the claimed id to a
DOM element via `.window[data-element_uuid="<id>"] .window-app-iframe`, and the check compares
`event.source` — the browser-supplied `WindowProxy` of the frame that actually called
`postMessage` — against that element's `contentWindow` by **object identity** (`!==`).

Why this is stronger than an origin-string comparison:

- **It is not attacker-supplied.** `event.origin` and every field of `event.data` are values the
  sender wrote. `event.source` is stamped by the browser and cannot be forged from inside a frame.
- **It binds to the *instance*, not the *app*.** Two windows of the same app share an origin
  (`https://<appname>.<app_domain>`, `src/gui/src/helpers/launchApp.js:432`) but are different
  `WindowProxy` objects, so instance A cannot act as instance B even though an origin check would
  pass for both.
- **It closes the disclosure hole named in the comment.** Instance IDs travel *to* other apps
  inside `messageToApp` payloads (`src/gui/src/definitions.js:170`,
  `src/gui/src/helpers.js:3455`), so an id is not a secret. Under an origin check, an app that
  learned an id could impersonate its holder; under the identity check, knowing the id buys
  nothing.
- **It survives navigation-and-origin games.** A frame that navigates to a different origin keeps a
  different `contentWindow` identity from the registered iframe unless it *is* that iframe; the
  gate tracks the live DOM element rather than a snapshot string.

`event.origin` is still captured, but only as *information for handlers*, not as the gate —
`ipc_context.caller.origin` (`src/gui/src/IPC.js:146-148`), commented "The frame's origin as it is
now (the message's), for handlers that must know who they are acting for."

The frames themselves are `sandbox="allow-forms allow-modals allow-pointer-lock allow-popups
allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-top-navigation-by-user-
activation allow-downloads allow-presentation allow-storage-access-by-user-activation"`
(`src/gui/src/UI/UIWindow.js:475`); `allow-same-origin` is dropped when `iframe_srcdoc` is used
(same line, and the reason is stated at `:457-458`). `credentialless` is added when cross-origin
isolation is on (`:465-468`).

The listener itself is attached with no origin filter. `src/gui/src/IPC.js:2135-2152` first tries
the `xd-incoming` puter.js service (`svc_xdIncoming.register_filter_listener(ipc_listener)`,
`:2141-2145`); that service no longer exists in this tree (no definition anywhere under `src/`),
so the fallback at `:2148-2151` runs — a plain `window.addEventListener('message', ...)` wrapping
the event in a `TeePromise` named `handled`.

### 5. Lifecycle

**Registration (launch).** `ExecService.launchApp` (`src/gui/src/services/ExecService.js:51`) ->
mint `child_instance_id` (`:56`) -> mint the connection pair if there is an IPC caller (`:59-62`)
-> build `launch_options` including `parent_instance_id` (real) and `parent_pseudo_id`
(`connection.backward.uuid`) (`:93-110`) -> `launch_app(launch_options)` (`:177`). Inside
`src/gui/src/helpers/launchApp.js`: `uuid = options.uuid ?? window.uuidv4()` (`:163`) ->
`new PortalProcess({uuid, name, parent: options.parent_instance_id, meta})` (`:411-419`) ->
`svc_process.register(process)` (`:421`) -> iframe URL params, including
`puter.app_instance_id` (`:441`) and `puter.parent_instance_id` (`:449`) ->
`window.app_instance_ids.add(uuid)` (`:572`) -> `UIWindow({element_uuid: uuid, iframe_url, ...})`
(`:681-717`) -> `process.references.el_win = el` (`:753`) -> `process.chstatus(PROCESS_RUNNING)`
(`:800`).

`ProcessService.register` (`src/gui/src/services/ProcessService.js:82-97`) pushes onto
`processes`, sets `processes_map`, seeds an empty child list in `uuid_to_treelist`, then attaches
to the parent's list (defaulting `parent` to the NULL uuid `00000000-0000-0000-0000-000000000000`,
which is the init process, `:22`, `:34-37`).

**Attach (SDK handshake).** The child SDK posts `{msg:'READY', appInstanceID}`
(`src/puter-js/src/modules/UI.js:598-601`). The GUI sets `process.ipc_status =
PROCESS_IPC_ATTACHED` (`src/gui/src/IPC.js:176-182`). The `onchange('ipc_status', ...)` watcher
registered by `ExecService` (`src/gui/src/services/ExecService.js:206-224`) then stamps
`data-appUsesSDK="true"` on the iframe (`:209`), tells the parent
`{msg:'childAppLaunched', original_msg_id, child_instance_id, uses_sdk:true}` (`:191-204`, `:211`),
flushes saved broadcasts (`:214`), and re-focuses the window when it is visible and active
(`:220-223`). The equivalent watcher for non-ExecService launches is
`src/gui/src/helpers/launchApp.js:775-798`.

`data-appUsesSDK` is what `BroadcastService` selects on
(`src/gui/src/services/BroadcastService.js:34`, `:49`) and what the window close path reads to
decide whether the app gets a pre-close conversation (`src/gui/src/UI/UIWindow.js:3644`).

**Connection handshake (`connectToInstance` path only).**
`PortalProcess.handle_connection` (`src/gui/src/definitions.js:176-206`) posts
`{msg:'connection', appInstanceID: connection.uuid, args}` to the target iframe (`:192-196`), then
races a `TeePromise` against a **5000 ms** timeout (`:197-204`, "Connection timeout" at `:201`).
The listener it installs (`:179-191`) requires `evt.source === target` (`:180`),
`evt.data.$ === 'connection-resp'` (`:183`), and `evt.data.connection === connection.uuid` (`:184`).
The target app SDK surfaces this as the `connection` event with `accept` / `reject` closures
(`src/puter-js/src/modules/UI.js:873-898`); whatever value it passes to `accept` is returned to
the caller as `response` (`src/gui/src/services/ExecService.js:280-286`) and lands on
`connection.response` (`src/puter-js/src/modules/UI.js:324`). The `window.addEventListener` at
`src/gui/src/definitions.js:179` is never removed.

**Deregistration (close).** The jQuery close plugin (`src/gui/src/UI/UIWindow.js:3640`):
if the app uses the SDK, `sendWindowWillCloseMsg` first and abort the close if the app says no
(`:3650-3655`); then `delete window.menubars[appInstanceID]` and
**`window.app_instance_ids.delete(appInstanceID)`** (`:3657-3660`). From that instant every further
message from that frame fails the section-3 step-5 registry check.

The DOM `remove` handler registered at `src/gui/src/helpers/launchApp.js:802-805` calls
`svc_process.unregister(process.uuid)`. `ProcessService.unregister`
(`src/gui/src/services/ProcessService.js:99-121`) throws if the uuid is unknown (`:101-103`),
deletes from `processes_map`, splices out of `processes`, removes itself from its parent child
list, and **re-parents its children onto the init process** (`:116-120`).

`ExecService` registers a second `remove` handler (`src/gui/src/services/ExecService.js:226-242`):
if the parent never attached the SDK it sends `{uses_sdk:false}` and calls
`window.report_app_closed(child_process.uuid)` (`:229-231`); then it posts
`{msg:'appClosed', appInstanceID: connection?.forward?.uuid, statusCode: 0}` to the parent iframe
(`:237-241`) — the pseudo-uuid, so it matches the parent `AppConnection.targetAppInstanceID`.
Both parent-iframe reads are optional-chained (`:197`, `:237`) with the comments at `:194-196`
and `:233-236` explaining that the launcher may already be gone and that a throw inside the jQuery
`remove()` would abort the removal and strand the window in the DOM.

`window.report_app_closed` (`src/gui/src/helpers.js:3446-3471`) walks the DOM rather than the
registries: it posts `appClosed` up to the `data-parent_instance_id` iframe (`:3450-3458`) and down
to every `.window[data-parent_instance_id="<id>"]` iframe (`:3461-3468`). The trailing comment
"Once other AppConnections exist, those will need notifying too." (`:3470`) records that
non-parent/child connections are not on this path.

On the SDK side, `AppConnection` flips `#isOpen = false` and emits `close` with
`{appInstanceID: targetAppInstanceID, statusCode}` (`src/puter-js/src/modules/UI.js:366-377`);
after that `postMessage` and `close` short-circuit with a console warning
(`:399-408`, `:429-433`).

**In-flight messages.** There is no queue, no ack, and no cancellation anywhere on this bus.
Concretely:

- A call whose validation fails (`src/gui/src/IPC.js:96`, `:99`, `:108`) returns without any
  reply, so the SDK `#ipc_stub` promise (`src/puter-js/src/modules/UI.js:536-553`) and its
  `CallbackManager` entry stay pending for the life of the frame.
- Handlers are awaited inside `ipc_listener` (`src/gui/src/IPC.js:160`) and the reply is posted
  afterwards via `puter.util.rpc.send(iframe.contentWindow, msg_id, retval)` (`:162`). `iframe` was
  resolved *before* the await (`:141`).
- `CallbackManager.callbacks` entries are never deleted after firing
  (`src/puter-js/src/lib/xdrpc.js:44-61`); the legacy `window.appCallbackFunctions` entries *are*
  deleted on use (`src/gui/src/IPC.js:79`).
- `IPCService.connections_` entries are never deleted — `src/gui/src/services/IPCService.js:70`
  and `:71` are the only writes, `:76` the only read; there is no `connections_.delete` in the
  tree. A pseudo-uuid therefore stays resolvable after the process it targets is gone, and
  `InternalConnection.send` (`:31-38`) then calls `process.send` on an undefined process.
- The `handle_connection` 5 s timeout at `src/gui/src/definitions.js:199-203` is the only
  in-flight guard in the system.

### 6. Permission / capability model attached to a connection

The connection record itself (`{source, target, uuid, reverse}`,
`src/gui/src/services/IPCService.js:58-69`) carries **no** capability, scope, or grant field. It is
pure routing. Authorization is per-operation and lives in four unrelated places:

1. **Possession of the pseudo-uuid.** Holding `forward.uuid` is what lets an app reach the target
   via `messageToApp` (`src/gui/src/IPC.js:2059-2063`). The two TODOs directly above —
   "Determine if we should allow the message" and "Track message traffic between apps"
   (`src/gui/src/IPC.js:2054-2055`) — mark that there is no further check on this path.
   The fallback branch (`:2066-2076`), taken when the target id is *not* a known connection,
   resolves a **real** instance id straight to an iframe and forwards; `targetAppOrigin`
   (sender-supplied, always `'*'` from the SDK, `src/puter-js/src/modules/UI.js:417`) is used as
   the postMessage targetOrigin at `:2076`.
2. **`connectToInstance` — a hardcoded allowlist.** `src/gui/src/services/ExecService.js:258-264`:
   the comment reads "TODO: permissions integration; for now it's hardcoded" — the caller process
   name must be `phoenix` and the target app name must be `puter-linux`, else it throws
   "Connection not allowed." It also requires a caller process at all (`:253-256`).
3. **`closeApp` — parentage or godmode.** `src/gui/src/IPC.js:2091-2108`: allowed if
   `target_window.dataset['parent_instance_id'] === appInstanceID` (`:2093`), or if the caller app
   record has `godmode === true || godmode === 1` (`:2098-2104`); otherwise denied with a
   console warning (`:2113`). The same godmode test gates `file_paths` on launch
   (`src/gui/src/services/ExecService.js:126-129`).
4. **`requestPermission` — a user-facing dialog, unrelated to connections.**
   `src/gui/src/IPC.js:1366-1437`: auth gate via `window.is_auth()` / `UIWindowSignup`
   (`:1381-1393`), shape normalisation (`:1398-1401`), accepts `permission` (string) or
   `permissions` (array) (`:1406-1408`), caps the list at `MAX_REQUESTED_PERMISSIONS = 16` to match
   the server (`:1409-1419`), then calls `UIPermissionDialog({permissions, permission, app_uid,
   app_name})` (`:1421-1432`) and replies `{msg:'permissionGranted', granted, original_msg_id}`
   (`:1371-1377`). Every failure path calls `respond(...)` so the SDK promise settles (comment at
   `:1367-1368`).

Ambient capability instead of connection capability: each app iframe is handed a per-app auth token
in its URL (`puter.auth.token`, `src/gui/src/helpers/launchApp.js:490-495`, blocking the launch if
the token cannot be minted, `:496-530`), plus per-file `puter.fs.sign` signatures
(`src/gui/src/helpers/launchApp.js:320`, `src/gui/src/services/ExecService.js:150-153`).

---

## Message flow — one message end-to-end

Parent app **P** (already running, real uuid `P-real`) calls `puter.ui.launchApp('editor')`, then
sends the child a message.

**Phase 1 — the launch call.**

1. `UIModule.launchApp` normalises args and calls `#ipc_stub({method:'launchApp', parameters})`
   — `src/puter-js/src/modules/UI.js:2523-2568`.
2. `#ipc_stub` registers a resolver, getting `callback_id` — `src/puter-js/src/modules/UI.js:543`,
   `src/puter-js/src/lib/xdrpc.js:44-48` — and posts
   `{$:'puter-ipc', v:2, appInstanceID:'P-real', env:'app', msg:'launchApp', parameters,
   uuid:callback_id}` to `window.parent` with targetOrigin `'*'`
   (`src/puter-js/src/modules/UI.js:544-552`; `messageTarget` set at `:581`).
3. GUI `ipc_listener` fires (`src/gui/src/IPC.js:63`, attached at `:2148-2151`).
   `env==='app'` passes (`:64-70`); no `original_msg_id` (`:75`); `msg` present (`:90`);
   `'P-real'` present (`:95`) and in `window.app_instance_ids` (`:98`);
   `iframe_for_app_instance('P-real').contentWindow === event.source` (`:106-110`).
   `handled.resolve(true)` (`:112`).
4. `msg_id = event.data.uuid` (`:118`). `'launchApp'` is in `window.ipc_handlers` (`:124`, registered
   at `src/gui/src/services/ExecService.js:38-40` via `IPCService.register_ipc_handler`,
   `src/gui/src/services/IPCService.js:82-84`). `$` is already set, so the v1 coercion at `:130-138`
   is skipped.
5. `ipc_context` is built (`:141-155`): `caller.process = svc_process.get_by_uuid('P-real')`,
   `caller.origin = event.origin`, `caller.app = {appInstanceID:'P-real', iframe, window}`.
6. `spec.handler(event.data.parameters, {msg_id, ipc_context})` (`:160`) enters
   `ExecService.launchApp` (`src/gui/src/services/ExecService.js:51`).
7. `child_instance_id = 'C-real'` (`:56`). `ipc_context` exists, so
   `add_connection({source:'P-real', target:'C-real'})` mints `F` and `B`
   (`:59-62`; `src/gui/src/services/IPCService.js:55-73`). `connections_` now holds
   `F -> {source:'P-real', target:'C-real', uuid:F, reverse:B}` and
   `B -> {source:'C-real', target:'P-real', uuid:B, reverse:F}`.
8. `launch_options` gets `uuid:'C-real'`, `parent_instance_id:'P-real'`, `parent_pseudo_id:B`
   (`:93-110`); `launch_app(...)` runs (`:177`) and does the registration sequence in section 5 —
   the child iframe URL carries `?puter.app_instance_id=C-real&puter.parent_instance_id=B`
   (`src/gui/src/helpers/launchApp.js:441`, `:449`).
9. Handler returns `{appInstanceID: F, usesSDK: true, response:{launchResult}}`
   (`src/gui/src/services/ExecService.js:244-249`).
10. `puter.util.rpc.send(iframe.contentWindow, msg_id, retval)` (`src/gui/src/IPC.js:162`) posts
    `{$SCOPE:'9a9c83a4-...', id:msg_id, args:[retval]}` into P's frame
    (`src/puter-js/src/modules/Util.js:67-69`).
11. P's `CallbackManager` matches `$SCOPE` and resolves the stub
    (`src/puter-js/src/lib/xdrpc.js:50-61`). `AppConnection.from(app_info, ...)` builds P's handle
    with `targetAppInstanceID = F` (`src/puter-js/src/modules/UI.js:314-320`, `:336`).
12. Meanwhile C boots, reads `C-real` and `B` from its URL
    (`src/puter-js/src/index.js:544-554`), builds its parent handle with
    `targetAppInstanceID = B` (`src/puter-js/src/modules/UI.js:587-594`), and posts `READY`
    (`:598-601`) -> `ipc_status = PROCESS_IPC_ATTACHED` (`src/gui/src/IPC.js:176-182`) ->
    `data-appUsesSDK="true"` and `childAppLaunched` to P
    (`src/gui/src/services/ExecService.js:206-214`).

**Phase 2 — `conn.postMessage({hello:1})` from P to C.**

13. P posts `{msg:'messageToApp', appInstanceID:'P-real', targetAppInstanceID:F,
    targetAppOrigin:'*', contents:{hello:1}}` (`src/puter-js/src/modules/UI.js:410-419`).
14. GUI gate runs again on `'P-real'` (`src/gui/src/IPC.js:64-110`) — same six checks.
    `'messageToApp'` is not in `window.ipc_handlers`, so control falls past `:124` to the
    `ipc:message` CustomEvent dispatch for extensions (`:170`) and down the `else if` chain to
    `:2052`.
15. Destructure `{appInstanceID, targetAppInstanceID, targetAppOrigin, contents}` (`:2053`).
    `svc_ipc.get_connection(F)` (`:2059`) hits `connections_` and lazily builds — and caches on
    `entry.object` — an `InternalConnection` (`src/gui/src/services/IPCService.js:75-80`).
16. `conn.send({hello:1})` (`src/gui/src/IPC.js:2061`) ->
    `InternalConnection.send` (`src/gui/src/services/IPCService.js:31-38`): looks up
    `svc_process.get_by_uuid('C-real')`, builds `channel = {returnAddress: B}` (the record
    `reverse`), calls `process.send(channel, data)`. The GUI returns at `:2062` — the fallback
    iframe path at `:2066-2076` is not reached.
17. `PortalProcess.send` (`src/gui/src/definitions.js:165-174`) resolves C's iframe through the
    live `references.iframe` getter (`:83-89`) and posts
    `{msg:'messageToApp', appInstanceID:B, targetAppInstanceID:'C-real', contents:{hello:1}}`
    with targetOrigin `'*'` (`:167-173`; a commented-out origin-pinned form sits at `:172`).
18. C's `AppConnection` listener (`src/puter-js/src/modules/UI.js:351-364`) checks
    `event.data.appInstanceID === this.targetAppInstanceID` -> `B === B` (`:353`) and
    `event.data.targetAppInstanceID === this.appInstanceID` -> `'C-real' === 'C-real'` (`:358`),
    then `this.emit('message', event.data.contents)` (`:362`).

**Net effect:** P knows only `F`, C knows only `B`, and the GUI is the only party that can map
either to `P-real` / `C-real`.

---

## What makes it strong

- **The identity gate is browser-supplied.** `event.source !== owner_iframe.contentWindow`
  (`src/gui/src/IPC.js:107`) compares a `WindowProxy` object the sender cannot fabricate against
  the live DOM element registered for that id. Every other field on the message is sender-written.
- **Two disjoint ID namespaces.** Real instance uuids live in `window.app_instance_ids` +
  `processes_map`; routing pseudo-uuids live in `connections_`. Neither map ever contains the
  other's keys, so a leaked pseudo-uuid cannot be used as an `appInstanceID` and a leaked real
  uuid cannot be used as a routing target on the connection path.
- **Peers never learn each other's real identity.** `launchApp` returns `connection.forward.uuid`,
  not `child_instance_id` (`src/gui/src/services/ExecService.js:245-246`), and the child is told
  `connection.backward.uuid`, not the parent's uuid
  (`src/gui/src/services/ExecService.js:108`, `src/gui/src/helpers/launchApp.js:449`).
- **Capability = possession of an unguessable v4 uuid**, minted by the GUI, handed out once, and
  scoped to one direction of one edge (`src/gui/src/services/IPCService.js:56-57`).
- **Directionality is baked into the record.** `reverse` (`:61`, `:68`) means the GUI derives the
  return address from the connection, never from the message — an app cannot choose who a reply
  appears to come from.
- **The registry is a `Map` with a stated prototype-pollution rationale**
  (`src/gui/src/services/IPCService.js:47-51`) and a regression test for `__proto__` /
  `constructor` / `toString` (`src/gui/src/services/IPCService.test.js:70-80`).
- **The RPC serializer rebuilds objects with `defineProperty`**, so a `__proto__` key in a payload
  cannot walk into `Object.prototype` (`src/puter-js/src/lib/xdrpc.js:9-30`, used at `:86` and
  `:121`).
- **Handshake replies are namespaced away from the main bus.** `$: 'connection-resp'` and
  `$SCOPE` deliberately avoid the `msg` key so `IPC.js` cannot be tricked into dispatching them
  (`src/gui/src/definitions.js:181-182`, `src/puter-js/src/lib/xdrpc.js:6-7`).
- **A revocation point that is one line.** `window.app_instance_ids.delete(appInstanceID)`
  (`src/gui/src/UI/UIWindow.js:3659`) invalidates every future message from that frame at gate
  step 5, independent of DOM teardown timing.
- **Handlers are registered data, not a switch.** `register_ipc_handler`
  (`src/gui/src/services/IPCService.js:82-84`) plus the `spec.handler(parameters, {msg_id,
  ipc_context})` contract (`src/gui/src/IPC.js:159-162`) means new verbs arrive with caller
  identity already resolved.

---

## Lift notes for Prism

Where prior research was right, wrong, or incomplete:

| Prior claim | Verdict | The actual code |
|---|---|---|
| "A `(forward, backward)` UUID pair is minted and each side receives one" | **CORRECT** | `src/gui/src/services/IPCService.js:55-73`; distribution at `src/gui/src/services/ExecService.js:245-246` (parent gets `forward.uuid`) and `:108` -> `src/gui/src/helpers/launchApp.js:449` (child gets `backward.uuid`) |
| "...minted by the broker/kernel at app launch" | **PARTLY WRONG** | Minted by `IPCService`, but *called* from `ExecService`, and only `if (ipc_context)` — a desktop/taskbar launch mints **no pair** and the parent slot falls back to the raw `child_instance_id` (`src/gui/src/services/ExecService.js:59-62`, `:246`). There is a second, non-launch minting site: `connectToInstance` (`:275-278`) |
| The pair *are* the app instance IDs (implied by calling them connection UUIDs at launch) | **WRONG** | They are pseudo-IDs. The real instance uuid is `child_instance_id` (`src/gui/src/services/ExecService.js:56`) and lives in a different registry. The two namespaces never intersect |
| Envelope `{$:'puter-ipc', v, msg, appInstanceID, uuid, parameters}` | **CORRECT but INCOMPLETE** | `env` is missing and is the *first* thing checked (`src/gui/src/IPC.js:64-70`); real shape at `src/puter-js/src/modules/UI.js:544-552`. Also `uuid` is an incrementing integer callback id, not a UUID (`src/puter-js/src/lib/xdrpc.js:38`, `:45`) |
| "one envelope shape" | **INCOMPLETE** | Four-plus shapes: v2 typed, v1 flat (coerced at `src/gui/src/IPC.js:130-138`), `messageToApp`, the `$SCOPE` reply channel, and `$:'connection-resp'` |
| "a live registry validates `appInstanceID`" | **CORRECT** | `window.app_instance_ids`, a `Set` of strings (`src/gui/src/globals.js:29`), checked at `src/gui/src/IPC.js:98`. One writer (`src/gui/src/helpers/launchApp.js:572`), one deleter (`src/gui/src/UI/UIWindow.js:3659`) |
| "failed lookup -> error" | **CLARIFY** | `console.error` + `handled.resolve(false)` + `return` (`src/gui/src/IPC.js:99-101`). **No reply is sent**, so the caller promise hangs. Same for the missing-id (`:96`) and identity-mismatch (`:108`) paths |
| "an origin check, stronger than a plain origin string" | **STRONGER THAN STATED** | It is not an origin check at all — it is `WindowProxy` object identity (`src/gui/src/IPC.js:107`). `event.origin` is recorded as handler context only (`:146-148`) |
| "a permission model attached to the connection" | **WRONG** | The connection record carries no capability field. Authorization is per-operation and elsewhere: hardcoded allowlist (`src/gui/src/services/ExecService.js:258-264`), parentage/godmode (`src/gui/src/IPC.js:2091-2108`), user dialog (`:1366-1437`) |

Structural facts worth carrying into the broker + `digital-griot-mcp` channel design:

1. **The two-namespace split is the core idea**, not the UUID pair per se: a *routing* namespace
   (per-edge, per-direction, unguessable, handed out) and an *identity* namespace (per-instance,
   registry-backed, never disclosed to peers). The pair is just how one edge gets two directions.
2. **The identity gate needs a channel-level equivalent of `event.source`** — a token the sender
   cannot write. In Puter that is the browser's `WindowProxy`; a lift needs whatever the transport
   supplies out-of-band (socket handle, pid, connection id captured at accept time), not a
   self-declared field in the payload.
3. **Revocation is a single `Set.delete`** at `src/gui/src/UI/UIWindow.js:3659`, checked on the hot
   path before dispatch. That is the whole kill switch.
4. **`connections_` has no delete** (writes at `src/gui/src/services/IPCService.js:70-71`, read at
   `:76`, no removal in the tree), and `CallbackManager.callbacks` entries are never removed after
   firing (`src/puter-js/src/lib/xdrpc.js:44-61`). Puter's own cleanup story stops at
   `app_instance_ids` and `processes_map`.
5. **In-flight is unmanaged**: no ack, no queue, no cancellation; the only timeout anywhere is the
   5 s handshake race at `src/gui/src/definitions.js:197-204`. Every drop path is silent.
6. **The handler registry is the extension point** — `register_ipc_handler(name, {handler})`
   (`src/gui/src/services/IPCService.js:82-84`) and the `(parameters, {msg_id, ipc_context})`
   calling convention (`src/gui/src/IPC.js:159-162`), where `ipc_context.caller` arrives with
   process, origin, and app already resolved.
7. **The typed-tag convention (`$`) is what keeps sub-protocols off the main dispatcher** — stated
   explicitly at `src/gui/src/definitions.js:181-182`.

### File index

| File | Role |
|---|---|
| `src/gui/src/IPC.js` | the listener, the six-step gate, the `msg` dispatch chain, `messageToApp` / `closeApp` / `exit` / `requestPermission` |
| `src/gui/src/services/IPCService.js` | connection minting, `connections_` Map, `InternalConnection`, handler registry |
| `src/gui/src/services/IPCService.test.js` | round-trip and prototype-key regression tests |
| `src/gui/src/services/ExecService.js` | `launchApp` / `connectToInstance` handlers; pseudo-id distribution |
| `src/gui/src/services/ProcessService.js` | `processes_map`, `uuid_to_treelist`, register / unregister / re-parent |
| `src/gui/src/services/BroadcastService.js` | fan-out to `data-appUsesSDK` frames; replay to new instances |
| `src/gui/src/definitions.js` | `Process` / `PortalProcess` / `PseudoProcess`, `send`, `handle_connection` |
| `src/gui/src/helpers/launchApp.js` | instance uuid, process registration, iframe URL params, `app_instance_ids.add` |
| `src/gui/src/helpers.js` | `window_for_app_instance`, `iframe_for_app_instance`, `report_app_closed` |
| `src/gui/src/globals.js` | `window.app_instance_ids` |
| `src/gui/src/UI/UIWindow.js` | iframe element and sandbox attrs; close-path deregistration |
| `src/puter-js/src/modules/UI.js` | `AppConnection`, `#ipc_stub`, `launchApp`, `connectToInstance`, the app-side listener |
| `src/puter-js/src/modules/Util.js` | `UtilRPC` (`send`, `registerCallback`, dehydrate/hydrate) |
| `src/puter-js/src/lib/xdrpc.js` | `$SCOPE`, `CallbackManager`, `Dehydrator`, `Hydrator`, `defineOwn` |
| `src/puter-js/src/index.js` | reads `puter.app_instance_id` / `puter.parent_instance_id` from the URL |
