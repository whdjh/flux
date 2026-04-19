import { describe, it, expect } from "vitest";
import {
  SessionSchema,
  CreateSessionSchema,
  CloseSessionSchema,
  type Session,
} from "./session";

describe("SessionSchema", () => {
  const base: Session = {
    id: "ses_1",
    user_id: "usr_1",
    name: "제품 리서치 4/19",
    started_at: "2026-04-19T00:00:00.000Z",
    ended_at: null,
    created_by: "user",
  };

  it("열린 세션(ended_at null)을 통과시킨다", () => {
    expect(SessionSchema.safeParse(base).success).toBe(true);
  });

  it("닫힌 세션(ended_at 존재)을 통과시킨다", () => {
    expect(
      SessionSchema.safeParse({
        ...base,
        ended_at: "2026-04-19T01:00:00.000Z",
      }).success
    ).toBe(true);
  });

  it("AI가 만든 세션을 구분한다 (created_by: ai)", () => {
    const result = SessionSchema.safeParse({ ...base, created_by: "ai" });
    expect(result.success).toBe(true);
  });

  it("created_by가 user·ai 외 값이면 거부", () => {
    const result = SessionSchema.safeParse({ ...base, created_by: "system" });
    expect(result.success).toBe(false);
  });

  it("name이 비어있으면 거부", () => {
    expect(SessionSchema.safeParse({ ...base, name: "" }).success).toBe(false);
  });
});

describe("CreateSessionSchema", () => {
  it("name만 필수, started_at·created_by는 기본값", () => {
    const result = CreateSessionSchema.safeParse({ name: "새 세션" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.created_by).toBe("user");
    }
  });

  it("AI가 생성 요청 시 명시", () => {
    const result = CreateSessionSchema.safeParse({
      name: "자동 분류됨",
      created_by: "ai",
    });
    expect(result.success).toBe(true);
  });
});

describe("CloseSessionSchema", () => {
  it("id만 있으면 종료 가능", () => {
    expect(CloseSessionSchema.safeParse({ id: "ses_1" }).success).toBe(true);
  });

  it("id 빠지면 거부", () => {
    expect(CloseSessionSchema.safeParse({}).success).toBe(false);
  });
});
