export {
  FluxDoc,
  TEXT_CONTAINER,
  EMBEDS_CONTAINER,
  DEFAULT_MAX_UNDO_STEPS,
} from "./flux-doc";
export type { FluxDocJSON, FluxDocOptions } from "./flux-doc";

export {
  insertText,
  deleteText,
  applyMarks,
  getTextDelta,
  SUPPORTED_MARKS,
} from "./text-ops";
export type { MarkKey, MarkValue, MarkRange } from "./text-ops";

export {
  embedItem,
  removeEmbed,
  removeEmbedByItemId,
  listEmbeds,
} from "./embed-ops";
export type { EmbedEntry } from "./embed-ops";

export { subscribe } from "./subscribe";
export type { DeltaHandler, Unsubscribe } from "./subscribe";

export {
  undo,
  redo,
  canUndo,
  canRedo,
  setMaxUndoSteps,
  clearHistory,
} from "./history";
