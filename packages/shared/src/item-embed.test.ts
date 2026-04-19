import { describe, it, expect } from "vitest";
import {
  ItemEmbedSchema,
  CreateItemEmbedSchema,
  type ItemEmbed,
} from "./item-embed";

describe("ItemEmbedSchema", () => {
  const base: ItemEmbed = {
    document_id: "doc_1",
    item_id: "itm_1",
    position: 0,
  };

  it("필수 필드를 갖춘 ItemEmbed를 통과시킨다", () => {
    expect(ItemEmbedSchema.safeParse(base).success).toBe(true);
  });

  it("position은 0 이상 정수여야 한다", () => {
    expect(ItemEmbedSchema.safeParse({ ...base, position: -1 }).success).toBe(
      false
    );
    expect(ItemEmbedSchema.safeParse({ ...base, position: 1.5 }).success).toBe(
      false
    );
  });

  it("문서·아이템 id가 비어있으면 거부", () => {
    expect(
      ItemEmbedSchema.safeParse({ ...base, document_id: "" }).success
    ).toBe(false);
    expect(ItemEmbedSchema.safeParse({ ...base, item_id: "" }).success).toBe(
      false
    );
  });
});

describe("CreateItemEmbedSchema", () => {
  it("생성 시 필드 동일", () => {
    expect(
      CreateItemEmbedSchema.safeParse({
        document_id: "doc_1",
        item_id: "itm_1",
        position: 3,
      }).success
    ).toBe(true);
  });

  it("position 기본값 없음 — 명시 필수", () => {
    expect(
      CreateItemEmbedSchema.safeParse({
        document_id: "doc_1",
        item_id: "itm_1",
      }).success
    ).toBe(false);
  });
});
