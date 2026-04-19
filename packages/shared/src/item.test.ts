import { describe, it, expect } from "vitest";
import {
  ITEM_TYPES,
  ItemSchema,
  CreateItemSchema,
  type Item,
  type ItemType,
  type CreateItem,
} from "./item";

describe("ItemType", () => {
  it("여섯 가지 타입을 가진다", () => {
    expect(ITEM_TYPES).toEqual([
      "text",
      "image",
      "link",
      "video",
      "screenshot",
      "clipboard",
    ]);
  });

  it("정의되지 않은 타입을 거부한다", () => {
    const result = ItemSchema.safeParse({
      id: "itm_1",
      user_id: "usr_1",
      type: "audio",
      content: "x",
      created_at: new Date().toISOString(),
      sync_file: false,
    });
    expect(result.success).toBe(false);
  });
});

describe("ItemSchema", () => {
  const baseItem = {
    id: "itm_1",
    user_id: "usr_1",
    type: "text" as ItemType,
    content: "메모 내용",
    created_at: "2026-04-19T00:00:00.000Z",
    sync_file: false,
  };

  it("필수 필드만 있는 Item을 통과시킨다", () => {
    const result = ItemSchema.safeParse(baseItem);
    expect(result.success).toBe(true);
  });

  it("metadata와 ai 필드는 선택적이다", () => {
    const result = ItemSchema.safeParse({
      ...baseItem,
      metadata: { url: "https://example.com", title: "예시" },
      ai: { summary: "한 줄 요약", keywords: ["ai", "test"] },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata?.url).toBe("https://example.com");
      expect(result.data.ai?.keywords).toHaveLength(2);
    }
  });

  it("folder_id는 null 허용", () => {
    const result = ItemSchema.safeParse({ ...baseItem, folder_id: null });
    expect(result.success).toBe(true);
  });

  it("folder_id 문자열도 허용", () => {
    const result = ItemSchema.safeParse({ ...baseItem, folder_id: "fld_1" });
    expect(result.success).toBe(true);
  });

  it("sync_file은 기본값 false", () => {
    const { sync_file: _unused, ...withoutSync } = baseItem;
    const result = ItemSchema.safeParse(withoutSync);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sync_file).toBe(false);
    }
  });

  it("created_at은 ISO 문자열이어야 한다", () => {
    const result = ItemSchema.safeParse({ ...baseItem, created_at: "not-a-date" });
    expect(result.success).toBe(false);
  });

  it("id가 비어있으면 거부한다", () => {
    const result = ItemSchema.safeParse({ ...baseItem, id: "" });
    expect(result.success).toBe(false);
  });

  it("content가 비어있어도 허용한다 (빈 메모 가능)", () => {
    const result = ItemSchema.safeParse({ ...baseItem, content: "" });
    expect(result.success).toBe(true);
  });
});

describe("CreateItemSchema", () => {
  it("id, created_at, user_id 없이 생성 입력을 허용한다 (서버가 부여)", () => {
    const result = CreateItemSchema.safeParse({
      type: "link",
      content: "https://example.com",
    });
    expect(result.success).toBe(true);
  });

  it("타입은 필수다", () => {
    const result = CreateItemSchema.safeParse({ content: "x" });
    expect(result.success).toBe(false);
  });

  it("metadata·ai·folder_id는 입력 시점에 선택 가능", () => {
    const input: CreateItem = {
      type: "image",
      content: "/local/path.png",
      metadata: { title: "사진" },
      folder_id: "fld_1",
    };
    const result = CreateItemSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("sync_file 기본값 false", () => {
    const result = CreateItemSchema.safeParse({ type: "text", content: "x" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sync_file).toBe(false);
    }
  });
});

describe("타입 추출", () => {
  it("Item 타입이 스키마와 동등하다", () => {
    const item: Item = {
      id: "itm_1",
      user_id: "usr_1",
      type: "link",
      content: "https://example.com",
      created_at: "2026-04-19T00:00:00.000Z",
      sync_file: false,
    };
    expect(ItemSchema.parse(item)).toEqual(item);
  });
});
