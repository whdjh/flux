import { z } from "zod";
import {
  BadRequestError,
  CreateFolderSchema,
  FolderSchema,
  UpdateFolderSchema,
  type CreateFolder,
  type Folder,
  type UpdateFolder,
} from "@flux/shared";
import type { RestClient } from "./rest";

const FolderListSchema = z.array(FolderSchema);

export class FoldersApi {
  constructor(private rest: RestClient) {}

  list(): Promise<Folder[]> {
    return this.rest.request({
      method: "GET",
      path: "/folders",
      schema: FolderListSchema,
    });
  }

  get(id: string): Promise<Folder> {
    return this.rest.request({
      method: "GET",
      path: `/folders/${encodeURIComponent(id)}`,
      schema: FolderSchema,
    });
  }

  async create(input: CreateFolder): Promise<Folder> {
    const parsed = CreateFolderSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestError(`invalid create folder input: ${parsed.error.message}`);
    }
    return this.rest.request({
      method: "POST",
      path: "/folders",
      body: parsed.data,
      schema: FolderSchema,
    });
  }

  async update(id: string, input: UpdateFolder): Promise<Folder> {
    const parsed = UpdateFolderSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestError(`invalid update folder input: ${parsed.error.message}`);
    }
    return this.rest.request({
      method: "PATCH",
      path: `/folders/${encodeURIComponent(id)}`,
      body: parsed.data,
      schema: FolderSchema,
    });
  }

  remove(id: string): Promise<void> {
    return this.rest.request({
      method: "DELETE",
      path: `/folders/${encodeURIComponent(id)}`,
    });
  }
}
