import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RestClient } from "./rest";
import { FoldersApi } from "./folders";

describe("FoldersApi", () => {
  let originalFetch: typeof globalThis.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;
  let rest: RestClient;
  let api: FoldersApi;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    rest = new RestClient({ baseUrl: "https://api.example.com" });
    api = new FoldersApi(rest);
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const jsonResponse = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });

  const sampleFolder = {
    id: "fld_1",
    user_id: "usr_1",
    name: "받은 자료",
    parent_id: null,
  };

  describe("list", () => {
    it("GET /folders로 트리 배열을 반환한다", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, [sampleFolder]));
      const folders = await api.list();
      expect(folders).toHaveLength(1);
      expect(folders[0].name).toBe("받은 자료");
    });
  });

  describe("get", () => {
    it("GET /folders/:id", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, sampleFolder));
      const folder = await api.get("fld_1");
      expect(folder.id).toBe("fld_1");
    });
  });

  describe("create", () => {
    it("POST /folders로 name을 보낸다", async () => {
      fetchMock.mockResolvedValue(jsonResponse(201, sampleFolder));
      await api.create({ name: "새 폴더" });
      const [, init] = fetchMock.mock.calls[0];
      expect(init.method).toBe("POST");
      const body = JSON.parse(init.body as string);
      expect(body).toEqual({ name: "새 폴더" });
    });

    it("name이 비어있으면 스키마 에러", async () => {
      await expect(api.create({ name: "" })).rejects.toBeTruthy();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("PATCH /folders/:id", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, sampleFolder));
      await api.update("fld_1", { name: "변경됨" });
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://api.example.com/folders/fld_1");
      expect(init.method).toBe("PATCH");
    });

    it("parent_id만 변경도 허용", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, sampleFolder));
      await api.update("fld_1", { parent_id: "fld_root" });
      const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
      expect(body).toEqual({ parent_id: "fld_root" });
    });

    it("빈 업데이트는 스키마 에러", async () => {
      await expect(api.update("fld_1", {})).rejects.toBeTruthy();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("DELETE /folders/:id", async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
      await api.remove("fld_1");
      expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
    });
  });
});
