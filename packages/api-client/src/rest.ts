import type { ZodType } from "zod";
import {
  AppError,
  BadRequestError,
  ConflictError,
  InternalError,
  NotFoundError,
  UnauthorizedError,
  isAppError,
} from "@flux/shared";

export interface RetryPolicy {
  /** 총 재시도 횟수 (초기 시도 제외). 기본 2 */
  retries: number;
  /** 지수 백오프 기본 지연 ms. 기본 200 */
  baseDelayMs: number;
}

export interface RestClientOptions {
  /** API 기본 URL. 끝 슬래시는 제거된다 */
  baseUrl: string;
  /** 요청 때마다 호출되어 Bearer 토큰을 주입한다. null/undefined이면 주입 생략 */
  getToken?: () => string | null | undefined;
  /** 5xx · 네트워크 실패 재시도 정책 */
  retry?: RetryPolicy;
  /** 기본 헤더. Authorization·Content-Type은 자동으로 덮어쓴다 */
  headers?: Record<string, string>;
  /** 테스트용 주입 훅 */
  fetch?: typeof fetch;
  /** 지수 백오프 sleep 주입 (테스트용). 기본은 setTimeout */
  sleep?: (ms: number) => Promise<void>;
}

export interface RequestSpec<T> {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  /** 응답 본문 검증 스키마. 없으면 undefined 반환 (204 등) */
  schema?: ZodType<T>;
  /** 이 요청에만 적용할 추가 헤더 */
  headers?: Record<string, string>;
}

const DEFAULT_RETRY: RetryPolicy = { retries: 2, baseDelayMs: 200 };

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export class RestClient {
  readonly baseUrl: string;
  private getToken?: () => string | null | undefined;
  private retry: RetryPolicy;
  private baseHeaders: Record<string, string>;
  private fetchImpl: typeof fetch;
  private sleepImpl: (ms: number) => Promise<void>;
  private token: string | null = null;

  constructor(options: RestClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.getToken = options.getToken;
    this.retry = options.retry ?? DEFAULT_RETRY;
    this.baseHeaders = options.headers ?? {};
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.sleepImpl = options.sleep ?? defaultSleep;
  }

  /** 토큰을 런타임에 수동 주입. getToken이 없을 때 사용 */
  setToken(token: string | null): void {
    this.token = token;
  }

  async request<T = undefined>(spec: RequestSpec<T>): Promise<T> {
    const url = this.buildUrl(spec.path, spec.query);
    const headers = this.buildHeaders(spec);
    const init: RequestInit = {
      method: spec.method,
      headers,
    };
    if (spec.body !== undefined) {
      (init as { body: string }).body = JSON.stringify(spec.body);
    }

    let lastErr: unknown;
    const maxAttempts = this.retry.retries + 1;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await this.fetchImpl(url, init);
        if (res.ok) {
          return await this.parseSuccess<T>(res, spec.schema);
        }
        if (res.status >= 500) {
          lastErr = await this.toAppError(res);
          if (attempt < maxAttempts) {
            await this.sleepImpl(this.backoff(attempt));
            continue;
          }
          throw lastErr;
        }
        // 4xx · 즉시 실패
        throw await this.toAppError(res);
      } catch (err) {
        if (isAppError(err) && err.status < 500) {
          throw err;
        }
        lastErr = err;
        if (attempt < maxAttempts) {
          await this.sleepImpl(this.backoff(attempt));
          continue;
        }
        if (isAppError(err)) {
          throw err;
        }
        throw new InternalError("network or server error", { cause: err });
      }
    }
    // 도달 불가지만 타입상 필요
    throw (lastErr ?? new InternalError("unknown error")) as Error;
  }

  private buildUrl(path: string, query?: RequestSpec<unknown>["query"]): string {
    const base = `${this.baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
    if (!query) return base;
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      params.append(k, String(v));
    }
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }

  private buildHeaders(spec: RequestSpec<unknown>): Record<string, string> {
    const headers: Record<string, string> = { ...this.baseHeaders, ...(spec.headers ?? {}) };
    if (spec.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    const token = this.getToken?.() ?? this.token;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  private backoff(attempt: number): number {
    return this.retry.baseDelayMs * Math.pow(2, attempt - 1);
  }

  private async parseSuccess<T>(res: Response, schema?: ZodType<T>): Promise<T> {
    if (res.status === 204 || !schema) {
      return undefined as T;
    }
    let payload: unknown;
    try {
      payload = await res.json();
    } catch (err) {
      throw new InternalError("invalid JSON response", { cause: err });
    }
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      throw new InternalError(`response schema mismatch: ${parsed.error.message}`);
    }
    return parsed.data;
  }

  private async toAppError(res: Response): Promise<AppError> {
    const message = await this.extractMessage(res);
    switch (res.status) {
      case 400:
        return new BadRequestError(message ?? "bad request");
      case 401:
        return new UnauthorizedError(message ?? "unauthorized");
      case 404:
        return new NotFoundError(message ?? "not found");
      case 409:
        return new ConflictError(message ?? "conflict");
      default:
        if (res.status >= 500) {
          return new InternalError(message ?? "internal server error");
        }
        return new BadRequestError(message ?? `unexpected status ${res.status}`);
    }
  }

  private async extractMessage(res: Response): Promise<string | undefined> {
    try {
      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const body = (await res.json()) as { message?: unknown };
        if (body && typeof body.message === "string") return body.message;
      } else {
        const text = await res.text();
        return text || undefined;
      }
    } catch {
      // ignore body parse failures
    }
    return undefined;
  }
}
