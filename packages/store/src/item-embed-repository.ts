import {
  type ItemEmbed,
  type CreateItemEmbed,
  ItemEmbedSchema,
} from "@flux/shared";
import type { RepositoryDeps } from "./repository";

interface ItemEmbedRow {
  document_id: string;
  item_id: string;
  position: number;
}

function rowToEmbed(row: ItemEmbedRow): ItemEmbed {
  return {
    document_id: row.document_id,
    item_id: row.item_id,
    position: row.position,
  };
}

export class ItemEmbedRepository {
  constructor(private readonly deps: RepositoryDeps) {}

  async findByDocument(documentId: string): Promise<ItemEmbed[]> {
    const rows = await this.deps.adapter.query<ItemEmbedRow>(
      "SELECT document_id, item_id, position FROM item_embeds WHERE document_id = ? ORDER BY position",
      [documentId]
    );
    return rows.map(rowToEmbed);
  }

  async findByItem(itemId: string): Promise<ItemEmbed[]> {
    const rows = await this.deps.adapter.query<ItemEmbedRow>(
      "SELECT document_id, item_id, position FROM item_embeds WHERE item_id = ?",
      [itemId]
    );
    return rows.map(rowToEmbed);
  }

  async insert(input: CreateItemEmbed): Promise<ItemEmbed> {
    const embed = ItemEmbedSchema.parse(input);
    await this.deps.adapter.exec(
      "INSERT INTO item_embeds (document_id, item_id, position) VALUES (?, ?, ?)",
      [embed.document_id, embed.item_id, embed.position]
    );
    return embed;
  }

  async delete(
    documentId: string,
    itemId: string,
    position: number
  ): Promise<boolean> {
    const before = await this.deps.adapter.query<ItemEmbedRow>(
      "SELECT document_id FROM item_embeds WHERE document_id = ? AND item_id = ? AND position = ?",
      [documentId, itemId, position]
    );
    if (before.length === 0) return false;
    await this.deps.adapter.exec(
      "DELETE FROM item_embeds WHERE document_id = ? AND item_id = ? AND position = ?",
      [documentId, itemId, position]
    );
    return true;
  }
}
