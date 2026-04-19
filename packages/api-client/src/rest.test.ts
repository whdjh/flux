import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import {
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
  ConflictError,
  InternalError,
} from "@flux/shared";
import { RestClient, type RestClientOptions } from "./rest";

describe("RestClient", () => {
  let originalFetch: typeof globalThis.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  const jsonResponse = (status: number, body: unknown, headers: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json", ...headers },
    });

  const makeClient = (overrides: Partial<RestClientOptions> = {}): RestClient =>
    new RestClient({ baseUrl: "https://api.example.com", ...overrides });

  describe("생성", () => {
    it("baseUrl을 옵션으로 받는다", () => {
      const client = makeClient();
      expect(client.baseUrl).toBe("https://api.example.com");
    });

    it("끝에 슬래시가 있는 baseUrl을 정규화한다", () => {
      const client = new RestClient({ baseUrl: "https://api.example.com/" });
      expect(client.baseUrl).toBe("https://api.example.com");
    });
  });

  describe("인증 헤더", () => {
    it("getToken이 토큰을 반환하면 Authorization 헤더를 자동 주입한다", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));
      const client = makeClient({ getToken: () => "tok_abc" });

      await client.request({
        method: "GET",
        path: "/items",
        schema: z.object({ ok: z.boolean() }),
      });

      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers.Authorization).toBe("Bearer tok_abc");
    });

    it("getToken이 null을 반환하면 Authorization 헤더가 없다", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));
      const client = makeClient({ getToken: () => null });

      await client.request({
        method: "GET",
        path: "/items",
        schema: z.object({ ok: z.boolean() }),
      });

      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers.Authorization).toBeUndefined();
    });

    it("getToken이 미지정이면 Authorization 헤더가 없다", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));
      const client = makeClient();

      await client.request({
        method: "GET",
        path: "/items",
        schema: z.object({ ok: z.boolean() }),
      });

      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers.Authorization).toBeUndefined();
    });

    it("setToken으로 토큰을 동적으로 갱신할 수 있다", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));
      const client = makeClient();
      client.setToken("tok_new");

      await client.request({
        method: "GET",
        path: "/items",
        schema: z.object({ ok: z.boolean() }),
      });
      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers.Authorization).toBe("Bearer tok_new");
    });
  });

  describe("URL 조립", () => {
    it("path를 baseUrl에 붙여 요청한다", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));
      const client = makeClient();

      await client.request({
        method: "GET",
        path: "/items",
        schema: z.object({ ok: z.boolean() }),
      });

      expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.com/items");
    });

    it("query 파라미터를 직렬화한다", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));
      const client = makeClient();

      await client.request({
        method: "GET",
        path: "/items",
        query: { limit: 10, cursor: "abc" },
        schema: z.object({ ok: z.boolean() }),
      });

      const url = fetchMock.mock.calls[0][0] as string;
      expect(url).toContain("limit=10");
      expect(url).toContain("cursor=abc");
    });

    it("undefined·null query 값은 생략한다", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));
      const client = makeClient();

      await client.request({
        method: "GET",
        path: "/items",
        query: { limit: 10, cursor: undefined, folder: null },
        schema: z.object({ ok: z.boolean() }),
      });

      const url = fetchMock.mock.calls[0][0] as string;
      expect(url).toContain("limit=10");
      expect(url).not.toContain("cursor");
      expect(url).not.toContain("folder");
    });
  });

  describe("JSON body", () => {
    it("body를 JSON으로 직렬화한다", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));
      const client = makeClient();

      await client.request({
        method: "POST",
        path: "/items",
        body: { type: "text", content: "hi" },
        schema: z.object({ ok: z.boolean() }),
      });

      const [, init] = fetchMock.mock.calls[0];
      expect(init.body).toBe(JSON.stringify({ type: "text", content: "hi" }));
      expect(init.headers["Content-Type"]).toBe("application/json");
    });

    it("body가 undefined면 직렬화하지 않는다", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));
      const client = makeClient();

      await client.request({
        method: "GET",
        path: "/items",
        schema: z.object({ ok: z.boolean() }),
      });

      const [, init] = fetchMock.mock.calls[0];
      expect(init.body).toBeUndefined();
    });
  });

  describe("응답 검증", () => {
    it("스키마와 일치하는 응답을 그대로 반환한다", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { id: "1", name: "a" }));
      const client = makeClient();

      const result = await client.request({
        method: "GET",
        path: "/x",
        schema: z.object({ id: z.string(), name: z.string() }),
      });

      expect(result).toEqual({ id: "1", name: "a" });
    });

    it("스키마와 불일치하면 InternalError를 던진다", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { id: 123 }));
      const client = makeClient();

      await expect(
        client.request({
          method: "GET",
          path: "/x",
          schema: z.object({ id: z.string() }),
        })
      ).rejects.toBeInstanceOf(InternalError);
    });

    it("204 No Content는 undefined를 반환한다 (schema 미지정 가능)", async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
      const client = makeClient();

      const result = await client.request({
        method: "DELETE",
        path: "/items/1",
      });

      expect(result).toBeUndefined();
    });
  });

  describe("에러 매핑", () => {
    it("401은 UnauthorizedError", async () => {
      fetchMock.mockResolvedValue(jsonResponse(401, { message: "bad token" }));
      const client = makeClient();

      await expect(
        client.request({
          method: "GET",
          path: "/me",
          schema: z.object({ ok: z.boolean() }),
        })
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it("404는 NotFoundError", async () => {
      fetchMock.mockResolvedValue(jsonResponse(404, { message: "nope" }));
      const client = makeClient();

      await expect(
        client.request({
          method: "GET",
          path: "/items/x",
          schema: z.object({ ok: z.boolean() }),
        })
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("400은 BadRequestError", async () => {
      fetchMock.mockResolvedValue(jsonResponse(400, { message: "bad" }));
      const client = makeClient();

      await expect(
        client.request({
          method: "POST",
          path: "/items",
          body: {},
          schema: z.object({ ok: z.boolean() }),
        })
      ).rejects.toBeInstanceOf(BadRequestError);
    });

    it("409는 ConflictError", async () => {
      fetchMock.mockResolvedValue(jsonResponse(409, { message: "dup" }));
      const client = makeClient();

      await expect(
        client.request({
          method: "POST",
          path: "/folders",
          body: {},
          schema: z.object({ ok: z.boolean() }),
        })
      ).rejects.toBeInstanceOf(ConflictError);
    });

    it("500 이상은 재시도 후 InternalError", async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(500, { message: "boom" }))
        .mockResolvedValueOnce(jsonResponse(500, { message: "boom" }))
        .mockResolvedValueOnce(jsonResponse(500, { message: "boom" }));
      const client = makeClient({ retry: { retries: 2, baseDelayMs: 1 } });

      await expect(
        client.request({
          method: "GET",
          path: "/items",
          schema: z.object({ ok: z.boolean() }),
        })
      ).rejects.toBeInstanceOf(InternalError);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("5xx 재시도 중 성공하면 결과를 반환한다", async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(503, { message: "busy" }))
        .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
      const client = makeClient({ retry: { retries: 3, baseDelayMs: 1 } });

      const result = await client.request({
        method: "GET",
        path: "/items",
        schema: z.object({ ok: z.boolean() }),
      });
      expect(result).toEqual({ ok: true });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("4xx는 재시도하지 않는다", async () => {
      fetchMock.mockResolvedValue(jsonResponse(400, { message: "bad" }));
      const client = makeClient({ retry: { retries: 3, baseDelayMs: 1 } });

      await expect(
        client.request({
          method: "GET",
          path: "/items",
          schema: z.object({ ok: z.boolean() }),
        })
      ).rejects.toBeInstanceOf(BadRequestError);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("네트워크 실패도 5xx처럼 재시도한다", async () => {
      fetchMock
        .mockRejectedValueOnce(new TypeError("network"))
        .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
      const client = makeClient({ retry: { retries: 2, baseDelayMs: 1 } });

      const result = await client.request({
        method: "GET",
        path: "/items",
        schema: z.object({ ok: z.boolean() }),
      });
      expect(result).toEqual({ ok: true });
    });

    it("모호한 상태코드(418)는 BadRequestError로 매핑한다", async () => {
      fetchMock.mockResolvedValue(jsonResponse(418, { message: "teapot" }));
      const client = makeClient();

      await expect(
        client.request({
          method: "GET",
          path: "/items",
          schema: z.object({ ok: z.boolean() }),
        })
      ).rejects.toBeInstanceOf(BadRequestError);
    });

    it("에러 body가 message를 포함하면 에러 메시지로 사용한다", async () => {
      fetchMock.mockResolvedValue(jsonResponse(404, { message: "item missing" }));
      const client = makeClient();

      try {
        await client.request({
          method: "GET",
          path: "/x",
          schema: z.object({ ok: z.boolean() }),
        });
        throw new Error("should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundError);
        expect((e as Error).message).toBe("item missing");
      }
    });

    it("에러 body가 비어있어도 기본 메시지로 실패한다", async () => {
      fetchMock.mockResolvedValue(new Response("", { status: 404 }));
      const client = makeClient();

      await expect(
        client.request({
          method: "GET",
          path: "/x",
          schema: z.object({ ok: z.boolean() }),
        })
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});
