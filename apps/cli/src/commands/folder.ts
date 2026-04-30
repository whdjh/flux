import type { Store, FolderNode } from "@flux/store";
import type { Folder, Item } from "@flux/shared";

export interface CreateFolderInput {
  name: string;
  parentId?: string;
}

export async function createFolder(
  store: Store,
  input: CreateFolderInput
): Promise<Folder> {
  return store.folders.insert({
    name: input.name,
    parent_id: input.parentId ?? null,
  });
}

export async function listFolders(store: Store): Promise<FolderNode[]> {
  return store.folders.findTree();
}

export async function moveItem(
  store: Store,
  itemId: string,
  folderId: string | null
): Promise<Item | null> {
  return store.items.update(itemId, { folder_id: folderId });
}

export function formatFolderTree(tree: FolderNode[]): string {
  if (tree.length === 0) return "(no folders)";
  const lines: string[] = [];
  const walk = (node: FolderNode, depth: number): void => {
    const indent = "  ".repeat(depth);
    lines.push(`${indent}${node.name}  (${node.id})`);
    for (const child of node.children) walk(child, depth + 1);
  };
  for (const root of tree) walk(root, 0);
  return lines.join("\n");
}
