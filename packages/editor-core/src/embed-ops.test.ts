import { describe, it, expect } from "vitest";
import { FluxDoc } from "./flux-doc";
import {
  embedItem,
  removeEmbed,
  removeEmbedByItemId,
  listEmbeds,
} from "./embed-ops";

describe("embed-ops", () => {
  describe("embedItem", () => {
    it("아이템을 임베드한다", () => {
      const doc = FluxDoc.create();
      embedItem(doc, 0, "item-1");
      expect(listEmbeds(doc)).toEqual([{ item_id: "item-1", position: 0 }]);
    });

    it("여러 아이템을 임베드하고 position으로 정렬한다", () => {
      const doc = FluxDoc.create();
      embedItem(doc, 5, "b");
      embedItem(doc, 2, "a");
      embedItem(doc, 8, "c");
      expect(listEmbeds(doc)).toEqual([
        { item_id: "a", position: 2 },
        { item_id: "b", position: 5 },
        { item_id: "c", position: 8 },
      ]);
    });

    it("같은 item_id는 중복 삽입되지 않는다", () => {
      const doc = FluxDoc.create();
      embedItem(doc, 0, "item-1");
      embedItem(doc, 5, "item-1");
      expect(listEmbeds(doc).length).toBe(1);
    });

    it("같은 position에 다른 item_id는 허용된다", () => {
      const doc = FluxDoc.create();
      embedItem(doc, 3, "a");
      embedItem(doc, 3, "b");
      const list = listEmbeds(doc);
      expect(list.length).toBe(2);
      expect(list.map((e) => e.item_id).sort()).toEqual(["a", "b"]);
    });

    it("음수 position은 예외", () => {
      const doc = FluxDoc.create();
      expect(() => embedItem(doc, -1, "x")).toThrow(RangeError);
    });

    it("비정수 position은 예외", () => {
      const doc = FluxDoc.create();
      expect(() => embedItem(doc, 1.5, "x")).toThrow(RangeError);
    });

    it("빈 itemId는 예외", () => {
      const doc = FluxDoc.create();
      expect(() => embedItem(doc, 0, "")).toThrow(TypeError);
    });

    it("itemId가 문자열이 아니면 예외", () => {
      const doc = FluxDoc.create();
      expect(() => embedItem(doc, 0, 123 as unknown as string)).toThrow(
        TypeError
      );
    });

    it("toJSON에도 임베드가 반영된다", () => {
      const doc = FluxDoc.create();
      embedItem(doc, 2, "a");
      embedItem(doc, 5, "b");
      expect(doc.toJSON().embeds).toEqual([
        { item_id: "a", position: 2 },
        { item_id: "b", position: 5 },
      ]);
    });
  });

  describe("removeEmbed", () => {
    it("position으로 임베드를 제거한다", () => {
      const doc = FluxDoc.create();
      embedItem(doc, 5, "x");
      removeEmbed(doc, 5);
      expect(listEmbeds(doc)).toEqual([]);
    });

    it("존재하지 않는 position은 no-op", () => {
      const doc = FluxDoc.create();
      embedItem(doc, 5, "x");
      removeEmbed(doc, 10);
      expect(listEmbeds(doc).length).toBe(1);
    });

    it("같은 position에 여러 엔트리가 있으면 item_id 사전순 첫째를 제거", () => {
      const doc = FluxDoc.create();
      embedItem(doc, 0, "c");
      embedItem(doc, 0, "a");
      embedItem(doc, 0, "b");
      removeEmbed(doc, 0);
      expect(listEmbeds(doc).map((e) => e.item_id)).toEqual(["b", "c"]);
    });

    it("음수 position은 예외", () => {
      const doc = FluxDoc.create();
      expect(() => removeEmbed(doc, -1)).toThrow(RangeError);
    });

    it("비정수 position은 예외", () => {
      const doc = FluxDoc.create();
      expect(() => removeEmbed(doc, 0.5)).toThrow(RangeError);
    });

    it("여러 제거 후 상태가 일관된다", () => {
      const doc = FluxDoc.create();
      embedItem(doc, 1, "a");
      embedItem(doc, 2, "b");
      embedItem(doc, 3, "c");
      removeEmbed(doc, 2);
      expect(listEmbeds(doc).map((e) => e.item_id)).toEqual(["a", "c"]);
    });
  });

  describe("removeEmbedByItemId", () => {
    it("item_id로 임베드를 제거한다", () => {
      const doc = FluxDoc.create();
      embedItem(doc, 1, "a");
      embedItem(doc, 2, "b");
      removeEmbedByItemId(doc, "a");
      expect(listEmbeds(doc).map((e) => e.item_id)).toEqual(["b"]);
    });

    it("없는 item_id는 no-op", () => {
      const doc = FluxDoc.create();
      embedItem(doc, 1, "a");
      removeEmbedByItemId(doc, "missing");
      expect(listEmbeds(doc).length).toBe(1);
    });

    it("빈 itemId는 no-op", () => {
      const doc = FluxDoc.create();
      embedItem(doc, 1, "a");
      removeEmbedByItemId(doc, "");
      expect(listEmbeds(doc).length).toBe(1);
    });
  });

  describe("listEmbeds", () => {
    it("빈 문서는 빈 배열", () => {
      const doc = FluxDoc.create();
      expect(listEmbeds(doc)).toEqual([]);
    });
  });
});
