/**
 * Layer 04 — the inspector. The box's real detail, both harvest halves.
 *
 * Waku's tabbed loop/memory/ops views, in our terms: when you click a box you get what
 * it IS (the UI half — file:line, mount point, what not to copy) and what it DOES (the
 * code half — capability, fit verdict, licence, the standing ruling). Fused, because
 * that is the pair a tooling decision actually needs.
 *
 * The layer select here does the same job as dragging across a lane; both write the
 * same field. Two routes to one act, never two sources of truth.
 */

import type { Node } from "@xyflow/react"
import type { ComponentNodeData } from "../02-render/ComponentNode"
import { ALL_SLOTS, ROLE_EMBER, ROLE_EQUIV, type LayerSlot } from "../../core/layer-roles"

export interface InspectorProps {
  node: Node<ComponentNodeData> | null
  reveal?: (origin: { repo: string; file: string; line: number }) => void | Promise<void>
  onRelayer: (nodeId: string, layer: LayerSlot) => void
}

const Field = ({ k, children, mono }: { k: string; children: React.ReactNode; mono?: boolean }) => (
  <div className="vz-field">
    <span className="vz-field-k">{k}</span>
    <span className={`vz-field-v${mono ? " mono" : ""}`}>{children}</span>
  </div>
)

export function Inspector({ node, reveal, onRelayer }: InspectorProps) {
  if (!node) {
    return (
      <aside className="vz-inspector">
        <h2>The canvas is the routing tool</h2>
        <p className="vz-hint">
          Drag a component out of the palette onto a lane — the lane it lands in <b>is</b> its layer
          role. Drag it to another lane and the role is reassigned.
        </p>
        <p className="vz-hint">
          Handle to handle writes an edge: that is how a component becomes part of a flow, and a
          flow part of a workflow.
        </p>
        <p className="vz-hint">
          <b>Export</b> writes JSON Canvas — the neutral wire between the engine's generators and
          its canvases. The same file opens in Obsidian and feeds{" "}
          <code>emit-canvas-nodes.mjs</code>, so bad routing is rejected rather than saved.
        </p>
        <div className="vz-legend">
          {ALL_SLOTS.map((r) => (
            <span key={r} className="vz-legend-row">
              <i style={{ background: ROLE_EMBER[r] }} />
              {r}
              {ROLE_EQUIV[r] && <em>{ROLE_EQUIV[r]}</em>}
            </span>
          ))}
        </div>
      </aside>
    )
  }

  const g = node.data.griot
  const ui = g.ui
  const code = g.code

  return (
    <aside className="vz-inspector">
      <h2 style={{ borderColor: ROLE_EMBER[g.layer as LayerSlot] }}>{node.data.label}</h2>

      <div className="vz-field">
        <span className="vz-field-k">layer role</span>
        <select
          className="vz-select"
          value={g.layer}
          onChange={(e) => onRelayer(node.id, e.target.value as LayerSlot)}
        >
          {ALL_SLOTS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {g.walkLevel && <Field k="walk level">{g.walkLevel}</Field>}

      {ui && (
        <>
          <div className="vz-field">
            <span className="vz-field-k">source · the evidence</span>
            <button className="vz-reveal" disabled={!reveal} onClick={() => reveal?.(ui.origin)}>
              {ui.origin.file}:{ui.origin.line}
              <span className="vz-reveal-cta">{reveal ? "open ↗" : "no reveal here"}</span>
            </button>
          </div>
          <Field k="mount point" mono>
            {ui.mountPoint}
          </Field>
          <Field k="repo" mono>
            {ui.origin.repo}
          </Field>
        </>
      )}

      {code && (
        <>
          {code.capability && <Field k="what it does">{code.capability}</Field>}
          {!!code.features?.length && (
            <Field k="features">
              <ul className="vz-list">
                {code.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </Field>
          )}
          {code.fit && (
            <Field k="fit verdict">
              {code.fit.app} <b>{"·".repeat(code.fit.strength)}</b> — {code.fit.why}
            </Field>
          )}
          <Field k="licence — a fact, never a verdict" mono>
            {code.licence}
          </Field>
          {(code.decision || code.role || code.stage) && (
            <Field k="ruling" mono>
              {[code.decision, code.role, code.stage].filter(Boolean).join(" · ")}
            </Field>
          )}
        </>
      )}

      <Field k="what NOT to copy">
        {ui?.notCopy?.length ? (
          <ul className="vz-list vz-notcopy">
            {ui.notCopy.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        ) : (
          <span className="vz-dim">— none recorded —</span>
        )}
      </Field>

      <Field k="provenance" mono>
        {g.provenance.harvestedBy} · {g.provenance.harvestedAt}
        {g.provenance.sourceCommit ? ` · ${g.provenance.sourceCommit}` : ""}
      </Field>
      <Field k="id" mono>
        {node.id}
      </Field>
    </aside>
  )
}
