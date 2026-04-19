import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RestClient } from "./rest";
import { ItemsApi } from "./items";

describe("ItemsApi", () => {
  let originalFetch: typeof globalThis.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;
  let rest: RestClient;
  let api: ItemsApi;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    rest = new RestClient({ baseUrl: "https://api.example.com" });
    api = new ItemsApi(rest);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const jsonResponse = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });

  const sampleItem = {
    id: "itm_1",
    user_id: "usr_1",
    type: "text" as const,
    content: "hi",
    created_at: "2026-04-19T00:00:00.000Z",
    sync_file: false,
  };

  describe("list", () => {
    it("GET /items를 호출하고 배열을 반환한다", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, [sampleItem]));
      const result = await api.list();
      expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.com/items");
      expect(fetchMock.mock.calls[0][1].method).toBe("GET");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("itm_1");
    });

    it("limit·cursor·folder_id 쿼리를 전달한다", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, []));
      await api.list({ limit: 20, cursor: "c1", folder_id: "fld_1" });
      const url = fetchMock.mock.calls[0][0] as string;
      expect(url).toContain("limit=20");
      expect(url).toContain("cursor=c1");
      expect(url).toContain("folder_id=fld_1");
    });

    it("folder_id=null은 쿼리에서 제외된다", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, []));
      await api.list({ folder_id: null });
      const url = fetchMock.mock.calls[0][0] as string;
      expect(url).not.toContain("folder_id");
    });
  });

  describe("get", () => {
    it("GET /items/:id를 호출한다", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, sampleItem));
      const item = await api.get("itm_1");
      expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.com/items/itm_1");
      expect(item.id).toBe("itm_1");
    });
  });

  describe("create", () => {
    it("POST /items로 body를 보낸다", async () => {
      fetchMock.mockResolvedValue(jsonResponse(201, sampleItem));
      await api.create({ type: "text", content: "hi" });
      const [, init] = fetchMock.mock.calls[0];
      expect(init.method).toBe("POST");
      const body = JSON.parse(init.body as string);
      expect(body).toEqual({ type: "text", content: "hi", sync_file: false });
    });

    it("입력이 스키마 위반이면 에러를 던진다 (타입 누락)", async () => {
      await expect(
        // @ts-expect-error runtime schema test
        api.create({ content: "hi" })
      ).rejects.toBeTruthy();
      // 네트워크 호출이 일어나지 않아야 한다
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("DELETE /items/:id를 호출하고 undefined 반환", async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
      const result = await api.remove("itm_1");
      expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.com/items/itm_1");
      expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
      expect(result).toBeUndefined();
    });
  });
});
