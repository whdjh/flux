import { describe, it, expect } from "vitest";
import {
  DocumentSchema,
  CreateDocumentSchema,
  UpdateDocumentSchema,
  type Document,
} from "./document";

describe("DocumentSchema", () => {
  const base: Document = {
    id: "doc_1",
    user_id: "usr_1",
    title: "회의 메모",
    crdt_doc: new Uint8Array([1, 2, 3]),
    created_at: "2026-04-19T00:00:00.000Z",
    updated_at: "2026-04-19T00:00:00.000Z",
    folder_id: null,
  };

  it("필수 필드를 갖춘 Document를 통과시킨다", () => {
    expect(DocumentSchema.safeParse(base).success).toBe(true);
  });

  it("crdt_doc이 Uint8Array가 아니면 거부한다", () => {
    const result = DocumentSchema.safeParse({ ...base, crdt_doc: "bytes" });
    expect(result.success).toBe(false);
  });

  it("title은 비어있어도 허용 (제목 없는 메모)", () => {
    expect(DocumentSchema.safeParse({ ...base, title: "" }).success).toBe(true);
  });

  it("folder_id는 null 또는 문자열", () => {
    expect(
      DocumentSchema.safeParse({ ...base, folder_id: "fld_1" }).success
    ).toBe(true);
    expect(DocumentSchema.safeParse({ ...base, folder_id: null }).success).toBe(
      true
    );
  });

  it("updated_at이 빠지면 거부한다", () => {
    const { updated_at: _u, ...rest } = base;
    expect(DocumentSchema.safeParse(rest).success).toBe(false);
  });
});

describe("CreateDocumentSchema", () => {
  it("title만으로 생성 가능 (crdt_doc은 서버 또는 클라이언트가 빈 문서 생성)", () => {
    const result = CreateDocumentSchema.safeParse({ title: "새 메모" });
    expect(result.success).toBe(true);
  });

  it("title과 folder_id 모두 선택 (둘 다 없으면 기본값)", () => {
    const result = CreateDocumentSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("crdt_doc은 입력 시점에 지정 가능 (기존 문서 복원 시)", () => {
    const result = CreateDocumentSchema.safeParse({
      title: "복원",
      crdt_doc: new Uint8Array([0]),
    });
    expect(result.success).toBe(true);
  });
});

describe("UpdateDocumentSchema", () => {
  it("title·crdt_doc·folder_id 중 하나만 있어도 통과", () => {
    expect(UpdateDocumentSchema.safeParse({ title: "새 제목" }).success).toBe(
      true
    );
    expect(
      UpdateDocumentSchema.safeParse({ crdt_doc: new Uint8Array([0]) }).success
    ).toBe(true);
    expect(
      UpdateDocumentSchema.safeParse({ folder_id: "fld_2" }).success
    ).toBe(true);
  });

  it("빈 객체는 거부 (아무것도 안 바뀌는 업데이트 무의미)", () => {
    expect(UpdateDocumentSchema.safeParse({}).success).toBe(false);
  });
});
