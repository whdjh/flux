import type { FluxDoc } from "./flux-doc";

/**
 * 문서 내부에 저장되는 임베드 엔트리. `ItemEmbed` 스키마에 대응하지만
 * CRDT 내부에서는 document_id가 불필요해 제외한다.
 */
export interface EmbedEntry {
  item_id: string;
  position: number;
}

/**
 * 위치 기준 정렬. 결정론적 순서를 보장한다.
 */
function sortByPosition(a: EmbedEntry, b: EmbedEntry): number {
  if (a.position !== b.position) {
    return a.position - b.position;
  }
  // position이 같으면 item_id로 안정 정렬.
  return a.item_id < b.item_id ? -1 : a.item_id > b.item_id ? 1 : 0;
}

/**
 * 현재 임베드 목록을 정렬해서 반환한다.
 */
export function listEmbeds(fluxDoc: FluxDoc): EmbedEntry[] {
  const list = fluxDoc.getEmbeds();
  const raw = list.toJSON() as unknown[];
  return raw
    .map((x): EmbedEntry => {
      const o = (x ?? {}) as { item_id?: unknown; position?: unknown };
      return {
        item_id: typeof o.item_id === "string" ? o.item_id : "",
        position: typeof o.position === "number" ? o.position : 0,
      };
    })
    .filter((e) => e.item_id !== "")
    .sort(sortByPosition);
}

/**
 * 주어진 position에 아이템을 임베드한다.
 *
 * 같은 item_id가 이미 존재하면 중복 삽입을 방지한다 (idempotent 보장).
 */
export function embedItem(
  fluxDoc: FluxDoc,
  position: number,
  itemId: string
): void {
  if (!Number.isInteger(position) || position < 0) {
    throw new RangeError(`position ${position} must be a non-negative integer`);
  }
  if (typeof itemId !== "string" || itemId.length === 0) {
    throw new TypeError("itemId must be a non-empty string");
  }

  const list = fluxDoc.getEmbeds();
  const existing = list.toJSON() as Array<{ item_id?: unknown }>;
  for (const e of existing) {
    if (e && typeof e.item_id === "string" && e.item_id === itemId) {
      // 이미 있으면 추가하지 않는다.
      return;
    }
  }

  // 항상 끝에 append한다. 정렬은 listEmbeds/toJSON에서 position 기준으로 처리.
  list.push({ item_id: itemId, position });
}

/**
 * 주어진 position의 임베드를 제거한다.
 *
 * 같은 position에 여러 엔트리가 있으면 item_id가 사전순으로 가장 앞인 것을 제거한다.
 * 제거할 엔트리가 없으면 아무 일도 일어나지 않는다.
 */
export function removeEmbed(fluxDoc: FluxDoc, position: number): void {
  if (!Number.isInteger(position) || position < 0) {
    throw new RangeError(`position ${position} must be a non-negative integer`);
  }
  const list = fluxDoc.getEmbeds();
  const raw = list.toJSON() as Array<{ item_id?: unknown; position?: unknown }>;

  // 결정론적으로 제거할 인덱스를 찾는다.
  const candidates: Array<{ index: number; entry: EmbedEntry }> = [];
  for (let i = 0; i < raw.length; i++) {
    const e = raw[i] ?? {};
    if (
      typeof e.item_id === "string" &&
      typeof e.position === "number" &&
      e.position === position
    ) {
      candidates.push({
        index: i,
        entry: { item_id: e.item_id, position: e.position },
      });
    }
  }

  if (candidates.length === 0) {
    return;
  }

  candidates.sort((a, b) => {
    if (a.entry.item_id < b.entry.item_id) return -1;
    if (a.entry.item_id > b.entry.item_id) return 1;
    return a.index - b.index;
  });

  const target = candidates[0];
  if (target === undefined) {
    return;
  }
  list.delete(target.index, 1);
}

/**
 * 특정 item_id를 가진 임베드를 제거한다. 보조 유틸.
 */
export function removeEmbedByItemId(fluxDoc: FluxDoc, itemId: string): void {
  if (typeof itemId !== "string" || itemId.length === 0) {
    return;
  }
  const list = fluxDoc.getEmbeds();
  const raw = list.toJSON() as Array<{ item_id?: unknown }>;
  for (let i = 0; i < raw.length; i++) {
    const e = raw[i] ?? {};
    if (typeof e.item_id === "string" && e.item_id === itemId) {
      list.delete(i, 1);
      return;
    }
  }
}
