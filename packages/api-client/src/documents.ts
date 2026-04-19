import { z } from "zod";
import {
  BadRequestError,
  CreateDocumentSchema,
  DocumentSchema,
  UpdateDocumentSchema,
  type CreateDocument,
  type Document,
  type UpdateDocument,
} from "@flux/shared";
import type { RestClient } from "./rest";

/**
 * 서버 응답의 crdt_doc은 base64 문자열로 전달된다.
 * 클라이언트에서는 Uint8Array로 복원해 DocumentSchema와 일치시킨다.
 */
const Base64ToBytes = z.string().transform((s) => base64ToBytes(s));

const DocumentResponseSchema = z.object({
  id: z.string().min(1),
  user_id: z.string().min(1),
  title: z.string(),
  crdt_doc: Base64ToBytes,
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
  folder_id: z.string().nullable(),
});

const DocumentListResponseSchema = z.array(DocumentResponseSchema);

function base64ToBytes(b64: string): Uint8Array {
  // Node·브라우저 공용 base64 디코더
  if (typeof atob === "function") {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  // Node.js 폴백
  const buf = Buffer.from(b64, "base64");
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof btoa === "function") {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }
  return Buffer.from(bytes).toString("base64");
}

function serializeBody<T extends { crdt_doc?: Uint8Array | undefined }>(
  input: T
): Record<string, unknown> {
  const copy: Record<string, unknown> = { ...input };
  if (input.crdt_doc instanceof Uint8Array) {
    copy.crdt_doc = bytesToBase64(input.crdt_doc);
  }
  return copy;
}

export class DocumentsApi {
  constructor(private rest: RestClient) {}

  list(): Promise<Document[]> {
    return this.rest.request({
      method: "GET",
      path: "/documents",
      schema: DocumentListResponseSchema,
    }) as Promise<Document[]>;
  }

  get(id: string): Promise<Document> {
    return this.rest.request({
      method: "GET",
      path: `/documents/${encodeURIComponent(id)}`,
      schema: DocumentResponseSchema,
    }) as Promise<Document>;
  }

  async create(input: CreateDocument): Promise<Document> {
    const parsed = CreateDocumentSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestError(`invalid create document input: ${parsed.error.message}`);
    }
    return this.rest.request({
      method: "POST",
      path: "/documents",
      body: serializeBody(parsed.data),
      schema: DocumentResponseSchema,
    }) as Promise<Document>;
  }

  async update(id: string, input: UpdateDocument): Promise<Document> {
    const parsed = UpdateDocumentSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestError(`invalid update document input: ${parsed.error.message}`);
    }
    return this.rest.request({
      method: "PATCH",
      path: `/documents/${encodeURIComponent(id)}`,
      body: serializeBody(parsed.data),
      schema: DocumentResponseSchema,
    }) as Promise<Document>;
  }

  remove(id: string): Promise<void> {
    return this.rest.request({
      method: "DELETE",
      path: `/documents/${encodeURIComponent(id)}`,
    });
  }
}
