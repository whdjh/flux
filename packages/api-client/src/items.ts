import { z } from "zod";
import {
  CreateItemSchema,
  ItemSchema,
  type CreateItem,
  type Item,
} from "@flux/shared";
import { BadRequestError } from "@flux/shared";
import type { RestClient } from "./rest";

const ItemListSchema = z.array(ItemSchema);

export interface ListItemsParams {
  limit?: number;
  cursor?: string;
  folder_id?: string | null;
}

export class ItemsApi {
  constructor(private rest: RestClient) {}

  list(params: ListItemsParams = {}): Promise<Item[]> {
    return this.rest.request({
      method: "GET",
      path: "/items",
      query: {
        limit: params.limit,
        cursor: params.cursor,
        folder_id: params.folder_id ?? undefined,
      },
      schema: ItemListSchema,
    });
  }

  get(id: string): Promise<Item> {
    return this.rest.request({
      method: "GET",
      path: `/items/${encodeURIComponent(id)}`,
      schema: ItemSchema,
    });
  }

  async create(input: CreateItem): Promise<Item> {
    const parsed = CreateItemSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestError(`invalid create item input: ${parsed.error.message}`);
    }
    return this.rest.request({
      method: "POST",
      path: "/items",
      body: parsed.data,
      schema: ItemSchema,
    });
  }

  remove(id: string): Promise<void> {
    return this.rest.request({
      method: "DELETE",
      path: `/items/${encodeURIComponent(id)}`,
    });
  }
}
