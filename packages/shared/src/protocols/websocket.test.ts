import { describe, it, expect } from "vitest";
import {
  WsMessageSchema,
  type WsMessage,
} from "./websocket";

describe("WsMessageSchema — tagged union", () => {
  it("crdt_delta 메시지를 파싱한다", () => {
    const msg = {
      type: "crdt_delta",
      doc_id: "doc_1",
      delta: new Uint8Array([1, 2, 3]),
    };
    const result = WsMessageSchema.safeParse(msg);
    expect(result.success).toBe(true);
    if (result.success && result.data.type === "crdt_delta") {
      expect(result.data.doc_id).toBe("doc_1");
    }
  });

  it("item_created 메시지를 파싱한다", () => {
    const msg: WsMessage = {
      type: "item_created",
      item: {
        id: "itm_1",
        user_id: "usr_1",
        type: "text",
        content: "x",
        created_at: "2026-04-19T00:00:00.000Z",
        sync_file: false,
      },
    };
    expect(WsMessageSchema.safeParse(msg).success).toBe(true);
  });

  it("item_deleted 메시지를 파싱한다 (item_id만 전달)", () => {
    const msg: WsMessage = { type: "item_deleted", item_id: "itm_1" };
    expect(WsMessageSchema.safeParse(msg).success).toBe(true);
  });

  it("folder_updated 메시지를 파싱한다", () => {
    const msg: WsMessage = {
      type: "folder_updated",
      folder: {
        id: "fld_1",
        user_id: "usr_1",
        name: "리서치",
        parent_id: null,
      },
    };
    expect(WsMessageSchema.safeParse(msg).success).toBe(true);
  });

  it("알 수 없는 type은 거부한다", () => {
    expect(
      WsMessageSchema.safeParse({ type: "unknown_event" }).success
    ).toBe(false);
  });

  it("type 필드 없으면 거부한다", () => {
    expect(WsMessageSchema.safeParse({ doc_id: "doc_1" }).success).toBe(false);
  });

  it("type별 필수 필드 누락 시 거부 (crdt_delta에 doc_id 없음)", () => {
    expect(
      WsMessageSchema.safeParse({
        type: "crdt_delta",
        delta: new Uint8Array([]),
      }).success
    ).toBe(false);
  });
});
