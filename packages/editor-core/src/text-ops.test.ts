import { describe, it, expect } from "vitest";
import { FluxDoc } from "./flux-doc";
import {
  insertText,
  deleteText,
  applyMarks,
  getTextDelta,
  SUPPORTED_MARKS,
} from "./text-ops";

describe("text-ops", () => {
  describe("insertText", () => {
    it("빈 문서에 텍스트를 삽입한다", () => {
      const doc = FluxDoc.create();
      insertText(doc, "text", 0, "hello");
      expect(doc.toJSON().text).toBe("hello");
    });

    it("특정 오프셋에 삽입한다", () => {
      const doc = FluxDoc.create();
      insertText(doc, "text", 0, "hello world");
      insertText(doc, "text", 5, ",");
      expect(doc.toJSON().text).toBe("hello, world");
    });

    it("빈 문자열 삽입은 no-op이다", () => {
      const doc = FluxDoc.create();
      insertText(doc, "text", 0, "");
      expect(doc.toJSON().text).toBe("");
    });

    it("오프셋이 음수면 예외를 던진다", () => {
      const doc = FluxDoc.create();
      expect(() => insertText(doc, "text", -1, "x")).toThrow(RangeError);
    });

    it("오프셋이 길이보다 크면 예외를 던진다", () => {
      const doc = FluxDoc.create();
      insertText(doc, "text", 0, "ab");
      expect(() => insertText(doc, "text", 3, "x")).toThrow(RangeError);
    });

    it("지원되지 않는 path는 예외를 던진다", () => {
      const doc = FluxDoc.create();
      expect(() => insertText(doc, "other", 0, "x")).toThrow(/unsupported/);
    });

    it("text가 string이 아니면 TypeError", () => {
      const doc = FluxDoc.create();
      expect(() =>
        insertText(doc, "text", 0, 123 as unknown as string)
      ).toThrow(TypeError);
    });
  });

  describe("deleteText", () => {
    it("범위를 삭제한다", () => {
      const doc = FluxDoc.create();
      insertText(doc, "text", 0, "hello world");
      deleteText(doc, "text", 5, 6);
      expect(doc.toJSON().text).toBe("hello");
    });

    it("length 0은 no-op", () => {
      const doc = FluxDoc.create();
      insertText(doc, "text", 0, "abc");
      deleteText(doc, "text", 0, 0);
      expect(doc.toJSON().text).toBe("abc");
    });

    it("범위를 벗어나면 예외", () => {
      const doc = FluxDoc.create();
      insertText(doc, "text", 0, "abc");
      expect(() => deleteText(doc, "text", 0, 10)).toThrow(RangeError);
    });

    it("음수 length는 예외", () => {
      const doc = FluxDoc.create();
      insertText(doc, "text", 0, "abc");
      expect(() => deleteText(doc, "text", 0, -1)).toThrow(RangeError);
    });

    it("지원되지 않는 path는 예외", () => {
      const doc = FluxDoc.create();
      expect(() => deleteText(doc, "other", 0, 0)).toThrow(/unsupported/);
    });

    it("잘못된 offset은 예외", () => {
      const doc = FluxDoc.create();
      insertText(doc, "text", 0, "abc");
      expect(() => deleteText(doc, "text", -1, 1)).toThrow(RangeError);
    });
  });

  describe("applyMarks", () => {
    it("bold 마크를 적용한다", () => {
      const doc = FluxDoc.create();
      insertText(doc, "text", 0, "hello");
      applyMarks(doc, { start: 0, end: 5 }, { bold: true });
      const delta = getTextDelta(doc);
      expect(delta).toEqual([
        { insert: "hello", attributes: { bold: true } },
      ]);
    });

    it("여러 마크를 동시에 적용한다", () => {
      const doc = FluxDoc.create();
      insertText(doc, "text", 0, "hi");
      applyMarks(doc, { start: 0, end: 2 }, { bold: true, italic: true });
      const delta = getTextDelta(doc);
      expect(delta[0]?.attributes).toEqual({ bold: true, italic: true });
    });

    it("link 마크는 문자열 값으로 적용된다", () => {
      const doc = FluxDoc.create();
      insertText(doc, "text", 0, "link");
      applyMarks(doc, { start: 0, end: 4 }, { link: "https://example.com" });
      const delta = getTextDelta(doc);
      expect(delta[0]?.attributes).toEqual({ link: "https://example.com" });
    });

    it("null 값은 마크를 해제한다", () => {
      const doc = FluxDoc.create();
      insertText(doc, "text", 0, "hi");
      applyMarks(doc, { start: 0, end: 2 }, { bold: true });
      applyMarks(doc, { start: 0, end: 2 }, { bold: null });
      const delta = getTextDelta(doc);
      expect(delta[0]?.attributes?.bold).toBeFalsy();
    });

    it("false 값도 마크를 해제한다", () => {
      const doc = FluxDoc.create();
      insertText(doc, "text", 0, "hi");
      applyMarks(doc, { start: 0, end: 2 }, { italic: true });
      applyMarks(doc, { start: 0, end: 2 }, { italic: false });
      const delta = getTextDelta(doc);
      expect(delta[0]?.attributes?.italic).toBeFalsy();
    });

    it("start === end는 no-op", () => {
      const doc = FluxDoc.create();
      insertText(doc, "text", 0, "hi");
      applyMarks(doc, { start: 1, end: 1 }, { bold: true });
      const delta = getTextDelta(doc);
      expect(delta).toEqual([{ insert: "hi" }]);
    });

    it("범위가 잘못되면 예외", () => {
      const doc = FluxDoc.create();
      insertText(doc, "text", 0, "hi");
      expect(() =>
        applyMarks(doc, { start: 0, end: 10 }, { bold: true })
      ).toThrow(RangeError);
      expect(() =>
        applyMarks(doc, { start: -1, end: 1 }, { bold: true })
      ).toThrow(RangeError);
      expect(() =>
        applyMarks(doc, { start: 2, end: 1 }, { bold: true })
      ).toThrow(RangeError);
    });

    it("지원되지 않는 마크는 예외", () => {
      const doc = FluxDoc.create();
      insertText(doc, "text", 0, "hi");
      expect(() =>
        applyMarks(doc, { start: 0, end: 2 }, {
          fake: true,
        } as unknown as Record<string, boolean>)
      ).toThrow(/unsupported/);
    });

    it("SUPPORTED_MARKS 목록에 6개 마크가 있다", () => {
      expect(SUPPORTED_MARKS.length).toBe(6);
      expect(SUPPORTED_MARKS).toContain("bold");
      expect(SUPPORTED_MARKS).toContain("italic");
      expect(SUPPORTED_MARKS).toContain("underline");
      expect(SUPPORTED_MARKS).toContain("strike");
      expect(SUPPORTED_MARKS).toContain("code");
      expect(SUPPORTED_MARKS).toContain("link");
    });
  });

  describe("getTextDelta", () => {
    it("빈 문서는 빈 배열을 반환한다", () => {
      const doc = FluxDoc.create();
      expect(getTextDelta(doc)).toEqual([]);
    });

    it("마크가 없으면 단일 insert 엔트리다", () => {
      const doc = FluxDoc.create();
      insertText(doc, "text", 0, "abc");
      expect(getTextDelta(doc)).toEqual([{ insert: "abc" }]);
    });
  });
});
