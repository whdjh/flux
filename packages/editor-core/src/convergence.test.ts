import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { FluxDoc } from "./flux-doc";
import { insertText, deleteText } from "./text-ops";

/**
 * CRDT 수렴성: 서로 다른 편집 시퀀스를 교환한 두 FluxDoc의 최종 상태가 동일해야 한다.
 * loro 내장 delta 교환이 동작하는지를 검증한다.
 */

const T = "text";

function sync(a: FluxDoc, b: FluxDoc): void {
  // 양방향으로 한 번씩 델타 교환하면 충분히 수렴한다.
  const deltaFromA = a.exportDelta(b.version());
  const deltaFromB = b.exportDelta(a.version());
  b.importDelta(deltaFromA);
  a.importDelta(deltaFromB);
}

describe("convergence — 결정적 시나리오", () => {
  it("두 피어가 동시 삽입 후 델타 교환하면 상태가 일치한다", () => {
    const a = FluxDoc.create();
    const b = FluxDoc.create();
    a.setPeerId(BigInt(1));
    b.setPeerId(BigInt(2));

    insertText(a, T, 0, "Hello");
    sync(a, b);
    expect(b.toJSON().text).toBe("Hello");

    insertText(a, T, 5, " A");
    insertText(b, T, 0, "B ");
    sync(a, b);

    expect(a.toJSON().text).toBe(b.toJSON().text);
  });

  it("한쪽이 삭제, 다른쪽이 삽입해도 수렴한다", () => {
    const a = FluxDoc.create();
    const b = FluxDoc.create();
    a.setPeerId(BigInt(10));
    b.setPeerId(BigInt(20));

    insertText(a, T, 0, "abcdef");
    sync(a, b);

    deleteText(a, T, 1, 2);
    insertText(b, T, 6, "xyz");
    sync(a, b);

    expect(a.toJSON().text).toBe(b.toJSON().text);
  });

  it("세 피어가 각자 삽입 후 차례로 교환하면 모두 같은 상태가 된다", () => {
    const a = FluxDoc.create();
    const b = FluxDoc.create();
    const c = FluxDoc.create();
    a.setPeerId(BigInt(100));
    b.setPeerId(BigInt(200));
    c.setPeerId(BigInt(300));

    insertText(a, T, 0, "root");
    sync(a, b);
    sync(a, c);

    insertText(a, T, 4, "-a");
    insertText(b, T, 0, "b-");
    insertText(c, T, 2, "C");

    sync(a, b);
    sync(b, c);
    sync(a, c);
    sync(a, b);

    const ja = a.toJSON().text;
    expect(b.toJSON().text).toBe(ja);
    expect(c.toJSON().text).toBe(ja);
  });
});

describe("convergence — 속성 기반(fast-check)", () => {
  it("무작위 편집 시퀀스를 교환하면 두 피어가 항상 수렴한다", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            peer: fc.oneof(fc.constant("a"), fc.constant("b")),
            kind: fc.oneof(fc.constant("insert"), fc.constant("delete")),
            offset: fc.nat({ max: 20 }),
            text: fc.string({ minLength: 0, maxLength: 4 }),
            len: fc.nat({ max: 5 }),
          }),
          { maxLength: 12 }
        ),
        (ops) => {
          const a = FluxDoc.create();
          const b = FluxDoc.create();
          a.setPeerId(BigInt(1));
          b.setPeerId(BigInt(2));
          insertText(a, T, 0, "seed");
          sync(a, b);

          for (const op of ops) {
            const doc = op.peer === "a" ? a : b;
            const current = doc.toJSON().text;
            const offset = Math.min(op.offset, current.length);
            if (op.kind === "insert") {
              insertText(doc, T, offset, op.text);
            } else {
              const len = Math.min(op.len, current.length - offset);
              if (len > 0) deleteText(doc, T, offset, len);
            }
          }

          sync(a, b);
          sync(a, b);

          return a.toJSON().text === b.toJSON().text;
        }
      ),
      { numRuns: 20 }
    );
  });
});
