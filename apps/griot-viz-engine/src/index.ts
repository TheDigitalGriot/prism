/**
 * griot-viz-engine — public surface.
 *
 * The three mount targets Gavin named all import from here:
 *
 *   standalone   `npm run dev` in this folder -> src/main.tsx
 *   composed     Synaptiq / Audion / Griot Hub call mountVizEngine({element, ...})
 *   Djeli        the container mounts it as a panel (see mount.ts on the closed tab
 *                registry — that side is a ~6-site fork edit today, tracked in Djeli)
 *
 * A host that only wants the data format imports `json-canvas` / `layer-roles` and
 * never pulls React or xyflow into its bundle.
 */

export {
  mountVizEngine,
  detectHost,
  drive,
  WAKE_CHANNEL,
  type MountOptions,
  type VizEngineHandle,
  type VizHost,
} from "./core/mount"

export {
  LAYER_ROLES,
  ALL_SLOTS,
  UNPLACEABLE,
  ROLE_EMBER,
  ROLE_EQUIV,
  isLayerRole,
  isLayerSlot,
  type LayerRole,
  type LayerSlot,
} from "./core/layer-roles"

export {
  emptyCanvas,
  validate,
  assertValid,
  merge,
  serialize,
  type JSONCanvas,
  type CanvasNode,
  type CanvasEdge,
  type GriotNodeMeta,
  type Violation,
} from "./core/json-canvas"

export {
  adaptHarvest,
  loadFromKuzu,
  type HarvestedUxNode,
  type HarvestedCodeRow,
} from "./layers/03-substrate/harvest-adapter"
