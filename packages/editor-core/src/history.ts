import type { FluxDoc } from "./flux-doc";

/**
 * 로컬 변경을 되돌린다.
 *
 * loro UndoManager는 커밋된 변경만 되돌릴 수 있다. 보류 중인 변경이 있으면
 * 먼저 커밋해서 스택에 올린 뒤 undo한다.
 *
 * @returns 되돌릴 내용이 있어서 실행된 경우 true.
 */
export function undo(fluxDoc: FluxDoc): boolean {
  fluxDoc.commit();
  return fluxDoc.getUndoManager().undo();
}

/**
 * undo로 되돌린 변경을 다시 적용한다.
 *
 * @returns 되돌릴 수 있는 내용이 있어서 실행된 경우 true.
 */
export function redo(fluxDoc: FluxDoc): boolean {
  fluxDoc.commit();
  return fluxDoc.getUndoManager().redo();
}

/**
 * undo 가능 여부.
 */
export function canUndo(fluxDoc: FluxDoc): boolean {
  return fluxDoc.getUndoManager().canUndo();
}

/**
 * redo 가능 여부.
 */
export function canRedo(fluxDoc: FluxDoc): boolean {
  return fluxDoc.getUndoManager().canRedo();
}

/**
 * undo 스택의 최대 크기를 조정한다.
 */
export function setMaxUndoSteps(fluxDoc: FluxDoc, steps: number): void {
  if (!Number.isInteger(steps) || steps < 0) {
    throw new RangeError(`steps ${steps} must be a non-negative integer`);
  }
  fluxDoc.getUndoManager().setMaxUndoSteps(steps);
}

/**
 * undo/redo 스택을 비운다.
 */
export function clearHistory(fluxDoc: FluxDoc): void {
  fluxDoc.getUndoManager().clear();
}
