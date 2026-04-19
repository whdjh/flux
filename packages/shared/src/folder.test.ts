import { describe, it, expect } from "vitest";
import {
  FolderSchema,
  CreateFolderSchema,
  UpdateFolderSchema,
  type Folder,
} from "./folder";

describe("FolderSchema", () => {
  const base: Folder = {
    id: "fld_1",
    user_id: "usr_1",
    name: "리서치",
    parent_id: null,
  };

  it("루트 폴더(parent_id null)를 통과시킨다", () => {
    expect(FolderSchema.safeParse(base).success).toBe(true);
  });

  it("중첩 폴더(parent_id 지정)를 통과시킨다", () => {
    expect(
      FolderSchema.safeParse({ ...base, parent_id: "fld_0" }).success
    ).toBe(true);
  });

  it("name이 비어있으면 거부한다", () => {
    expect(FolderSchema.safeParse({ ...base, name: "" }).success).toBe(false);
  });
});

describe("CreateFolderSchema", () => {
  it("name만 있으면 생성 가능 (parent_id 선택, 기본 루트)", () => {
    expect(CreateFolderSchema.safeParse({ name: "새 폴더" }).success).toBe(true);
  });

  it("parent_id 지정 시 중첩 생성", () => {
    expect(
      CreateFolderSchema.safeParse({ name: "하위", parent_id: "fld_1" }).success
    ).toBe(true);
  });

  it("name이 없으면 거부", () => {
    expect(CreateFolderSchema.safeParse({}).success).toBe(false);
  });
});

describe("UpdateFolderSchema", () => {
  it("이름만 변경 가능", () => {
    expect(UpdateFolderSchema.safeParse({ name: "리네임" }).success).toBe(true);
  });

  it("parent_id만 변경 가능 (이동)", () => {
    expect(
      UpdateFolderSchema.safeParse({ parent_id: "fld_2" }).success
    ).toBe(true);
  });

  it("parent_id null로 이동 (루트로)", () => {
    expect(UpdateFolderSchema.safeParse({ parent_id: null }).success).toBe(true);
  });

  it("빈 객체 거부", () => {
    expect(UpdateFolderSchema.safeParse({}).success).toBe(false);
  });
});
