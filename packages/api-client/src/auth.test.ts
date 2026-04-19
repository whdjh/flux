import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RestClient } from "./rest";
import { AuthApi } from "./auth";

describe("AuthApi", () => {
  let originalFetch: typeof globalThis.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;
  let rest: RestClient;
  let api: AuthApi;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    rest = new RestClient({ baseUrl: "https://api.example.com" });
    api = new AuthApi(rest);
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const jsonResponse = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });

  describe("register", () => {
    it("POST /auth/register로 이메일·비밀번호를 보낸다", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(201, {
          user: { id: "usr_1", email: "a@b.com" },
          token: "tok_1",
        })
      );

      const result = await api.register({ email: "a@b.com", password: "pw123456" });
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://api.example.com/auth/register");
      expect(init.method).toBe("POST");
      const body = JSON.parse(init.body as string);
      expect(body).toEqual({ email: "a@b.com", password: "pw123456" });
      expect(result.token).toBe("tok_1");
      expect(result.user.id).toBe("usr_1");
    });

    it("이메일 형식이 잘못되면 스키마 에러", async () => {
      await expect(
        api.register({ email: "not-an-email", password: "pw123456" })
      ).rejects.toBeTruthy();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("비밀번호가 8자 미만이면 스키마 에러", async () => {
      await expect(
        api.register({ email: "a@b.com", password: "short" })
      ).rejects.toBeTruthy();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("POST /auth/login로 로그인 후 토큰·사용자를 반환한다", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(200, {
          user: { id: "usr_1", email: "a@b.com" },
          token: "tok_1",
        })
      );
      const result = await api.login({ email: "a@b.com", password: "pw123456" });
      expect(result.token).toBe("tok_1");
      expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.com/auth/login");
    });
  });

  describe("me", () => {
    it("GET /auth/me로 현재 사용자 반환", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { id: "usr_1", email: "a@b.com" }));
      const user = await api.me();
      expect(user.email).toBe("a@b.com");
      expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.com/auth/me");
      expect(fetchMock.mock.calls[0][1].method).toBe("GET");
    });
  });
});
