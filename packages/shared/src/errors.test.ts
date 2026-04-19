import { describe, it, expect } from "vitest";
import {
  AppError,
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
  ConflictError,
  InternalError,
  isAppError,
} from "./errors";

describe("AppError 계층", () => {
  it("UnauthorizedError는 AppError를 상속한다", () => {
    const err = new UnauthorizedError();
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(UnauthorizedError);
    expect(err.kind).toBe("unauthorized");
    expect(err.status).toBe(401);
  });

  it("NotFoundError 기본 메시지와 kind·status", () => {
    const err = new NotFoundError();
    expect(err.kind).toBe("not_found");
    expect(err.status).toBe(404);
  });

  it("BadRequestError에 사유 전달", () => {
    const err = new BadRequestError("invalid email");
    expect(err.kind).toBe("bad_request");
    expect(err.status).toBe(400);
    expect(err.message).toBe("invalid email");
  });

  it("ConflictError", () => {
    const err = new ConflictError("duplicate");
    expect(err.kind).toBe("conflict");
    expect(err.status).toBe(409);
  });

  it("InternalError는 원본 cause를 래핑한다", () => {
    const cause = new Error("db crashed");
    const err = new InternalError("unexpected", { cause });
    expect(err.kind).toBe("internal");
    expect(err.status).toBe(500);
    expect(err.cause).toBe(cause);
  });

  it("isAppError는 AppError 인스턴스만 true", () => {
    expect(isAppError(new UnauthorizedError())).toBe(true);
    expect(isAppError(new Error("generic"))).toBe(false);
    expect(isAppError("string")).toBe(false);
    expect(isAppError(null)).toBe(false);
  });
});

describe("toJSON", () => {
  it("클라이언트에 보낼 수 있는 직렬화 형식을 반환한다", () => {
    const err = new BadRequestError("missing field");
    expect(err.toJSON()).toEqual({
      kind: "bad_request",
      status: 400,
      message: "missing field",
    });
  });

  it("InternalError는 cause를 외부에 노출하지 않는다", () => {
    const err = new InternalError("server error", {
      cause: new Error("db password in message"),
    });
    const json = err.toJSON();
    expect(json).toEqual({
      kind: "internal",
      status: 500,
      message: "internal server error",
    });
    expect(JSON.stringify(json)).not.toContain("db password");
  });
});
