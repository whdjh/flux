import type { FluxDoc } from "./flux-doc";

/**
 * 로컬 편집이 발생할 때 호출되는 핸들러. 인자는 전송 가능한 바이너리 델타다.
 */
export type DeltaHandler = (delta: Uint8Array) => void;

/**
 * 구독 해제 함수.
 */
export type Unsubscribe = () => void;

/**
 * 로컬 편집에 반응해 델타를 방출한다.
 *
 * WebSocket으로 보낼 `WsCrdtDelta` 메시지의 `delta` 필드에 바로 꽂을 수 있는 형식이다.
 *
 * @example
 * ```ts
 * const unsub = subscribe(doc, (delta) => {
 *   ws.send({ type: "crdt_delta", doc_id, delta });
 * });
 * ```
 */
export function subscribe(
  fluxDoc: FluxDoc,
  handler: DeltaHandler
): Unsubscribe {
  if (typeof handler !== "function") {
    throw new TypeError("handler must be a function");
  }
  const unsub = fluxDoc.doc.subscribeLocalUpdates((bytes) => {
    handler(bytes);
  });
  return unsub;
}
