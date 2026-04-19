import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RestClient } from "./rest";
import { DocumentsApi } from "./documents";

describe("DocumentsApi", () => {
  let originalFetch: typeof globalThis.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;
  let rest: RestClient;
  let api: DocumentsApi;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    rest = new RestClient({ baseUrl: "https://api.example.com" });
    api = new DocumentsApi(rest);
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const jsonResponse = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });

  // 서버는 Uint8Array를 base64로 반환한다고 가정
  const toBase64 = (bytes: Uint8Array): string => {
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return Buffer.from(binary, "binary").toString("base64");
  };

  const sampleDoc = (overrides: Record<string, unknown> = {}) => ({
    id: "doc_1",
    user_id: "usr_1",
    title: "제목",
    crdt_doc: toBase64(new Uint8Array([1, 2, 3])),
    created_at: "2026-04-19T00:00:00.000Z",
    updated_at: "2026-04-19T00:00:00.000Z",
    folder_id: null,
    ...overrides,
  });

  describe("list", () => {
    it("GET /documents를 호출하고 Document 배열을 반환한다", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, [sampleDoc()]));
      const docs = await api.list();
      expect(docs).toHaveLength(1);
      expect(docs[0].id).toBe("doc_1");
      expect(docs[0].crdt_doc).toBeInstanceOf(Uint8Array);
      expect(Array.from(docs[0].crdt_doc)).toEqual([1, 2, 3]);
    });
  });

  describe("get", () => {
    it("GET /documents/:id", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, sampleDoc()));
      const doc = await api.get("doc_1");
      expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.com/documents/doc_1");
      expect(doc.id).toBe("doc_1");
    });
  });

  describe("create", () => {
    it("POST /documents로 title·crdt_doc을 base64로 보낸다", async () => {
      fetchMock.mockResolvedValue(jsonResponse(201, sampleDoc({ title: "새 문서" })));
      const bytes = new Uint8Array([4, 5, 6]);

      const doc = await api.create({ title: "새 문서", crdt_doc: bytes });
      const [, init] = fetchMock.mock.calls[0];
      const body = JSON.parse(init.body as string);
      expect(body.title).toBe("새 문서");
      expect(body.crdt_doc).toBe(toBase64(bytes));
      expect(doc.title).toBe("새 문서");
    });

    it("crdt_doc 없이도 생성 가능", async () => {
      fetchMock.mockResolvedValue(jsonResponse(201, sampleDoc()));
      await api.create({ title: "빈 문서" });
      const [, init] = fetchMock.mock.calls[0];
      const body = JSON.parse(init.body as string);
      expect(body.title).toBe("빈 문서");
      expect(body.crdt_doc).toBeUndefined();
    });
  });

  describe("update", () => {
    it("PATCH /documents/:id", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, sampleDoc({ title: "수정" })));
      await api.update("doc_1", { title: "수정" });
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://api.example.com/documents/doc_1");
      expect(init.method).toBe("PATCH");
    });

    it("빈 업데이트는 스키마 에러", async () => {
      await expect(api.update("doc_1", {})).rejects.toBeTruthy();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("DELETE /documents/:id", async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
      await api.remove("doc_1");
      expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
    });
  });
});
