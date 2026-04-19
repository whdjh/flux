import type { FluxDoc } from "./flux-doc";

/**
 * 지원되는 텍스트 마크 키.
 *
 * `configTextStyle`과 일치해야 한다. 모르는 키는 런타임에 거부한다.
 */
export const SUPPORTED_MARKS = [
  "bold",
  "italic",
  "underline",
  "strike",
  "code",
  "link",
] as const;
export type MarkKey = (typeof SUPPORTED_MARKS)[number];

/**
 * 마크 값. `false`면 제거, `null`이면 제거, 그 외는 설정.
 */
export type MarkValue = boolean | string | number | null;

/**
 * applyMarks에 전달하는 범위와 마크 집합.
 */
export interface MarkRange {
  start: number;
  end: number;
}

/**
 * 텍스트 오프셋 유효성 검사.
 */
function assertOffset(offset: number, length: number): void {
  if (!Number.isInteger(offset) || offset < 0 || offset > length) {
    throw new RangeError(
      `offset ${offset} out of bounds [0, ${length}]`
    );
  }
}

/**
 * 삭제 길이 유효성 검사.
 */
function assertDeleteRange(
  offset: number,
  length: number,
  textLength: number
): void {
  if (!Number.isInteger(length) || length < 0) {
    throw new RangeError(`length ${length} must be a non-negative integer`);
  }
  if (offset + length > textLength) {
    throw new RangeError(
      `delete range [${offset}, ${offset + length}] out of bounds [0, ${textLength}]`
    );
  }
}

/**
 * 텍스트 삽입. offset은 utf-16 인덱스다.
 *
 * `path`는 지금은 루트 텍스트 컨테이너("text")만 지원한다. 향후 중첩 컨테이너 대응 여지를 남긴다.
 */
export function insertText(
  fluxDoc: FluxDoc,
  path: string,
  offset: number,
  text: string
): void {
  if (path !== "text") {
    throw new Error(
      `unsupported path "${path}". Only root "text" container is supported.`
    );
  }
  if (typeof text !== "string") {
    throw new TypeError("text must be a string");
  }
  if (text.length === 0) {
    return;
  }
  const t = fluxDoc.getText();
  assertOffset(offset, t.length);
  t.insert(offset, text);
}

/**
 * 텍스트 삭제. offset과 length는 utf-16 기준.
 */
export function deleteText(
  fluxDoc: FluxDoc,
  path: string,
  offset: number,
  length: number
): void {
  if (path !== "text") {
    throw new Error(
      `unsupported path "${path}". Only root "text" container is supported.`
    );
  }
  const t = fluxDoc.getText();
  assertOffset(offset, t.length);
  assertDeleteRange(offset, length, t.length);
  if (length === 0) {
    return;
  }
  t.delete(offset, length);
}

/**
 * 마크 적용 또는 해제. `marks`의 값이 falsy(null/false)면 해제한다.
 */
export function applyMarks(
  fluxDoc: FluxDoc,
  range: MarkRange,
  marks: Partial<Record<MarkKey, MarkValue>>
): void {
  const t = fluxDoc.getText();
  const len = t.length;
  if (
    !Number.isInteger(range.start) ||
    !Number.isInteger(range.end) ||
    range.start < 0 ||
    range.end > len ||
    range.start > range.end
  ) {
    throw new RangeError(
      `mark range [${range.start}, ${range.end}] invalid for text length ${len}`
    );
  }
  if (range.start === range.end) {
    return;
  }
  for (const key of Object.keys(marks) as MarkKey[]) {
    if (!SUPPORTED_MARKS.includes(key)) {
      throw new Error(`unsupported mark "${key}"`);
    }
    const value = marks[key];
    if (value === null || value === false) {
      t.unmark({ start: range.start, end: range.end }, key);
    } else {
      t.mark({ start: range.start, end: range.end }, key, value);
    }
  }
}

/**
 * 텍스트의 현재 delta(rich text) 표현. UI 바인딩용.
 */
export function getTextDelta(fluxDoc: FluxDoc): ReturnType<
  ReturnType<FluxDoc["getText"]>["toDelta"]
> {
  return fluxDoc.getText().toDelta();
}
