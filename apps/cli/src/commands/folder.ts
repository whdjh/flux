import type { Command } from "commander";
import type { Store, FolderNode } from "@flux/store";
import type { Folder, Item } from "@flux/shared";
import type { CliContext } from "../db";

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

export function register(
  program: Command,
  openCli: () => Promise<CliContext>
): void {
  const folderCmd = program
    .command("folder")
    .description("폴더 관리 (create / ls / mv)");

  folderCmd
    .command("create")
    .description("폴더 생성")
    .argument("<name>", "폴더 이름")
    .option("--parent <id>", "부모 폴더 ID (없으면 루트)")
    .action(async (name: string, opts) => {
      const ctx = await openCli();
      try {
        const folder = await createFolder(ctx.store, {
          name,
          parentId: opts.parent,
        });
        process.stdout.write(`created ${folder.id}  ${folder.name}\n`);
      } finally {
        ctx.adapter.close();
      }
    });

  folderCmd
    .command("ls")
    .description("폴더 트리 출력")
    .action(async () => {
      const ctx = await openCli();
      try {
        const tree = await listFolders(ctx.store);
        process.stdout.write(formatFolderTree(tree) + "\n");
      } finally {
        ctx.adapter.close();
      }
    });

  folderCmd
    .command("mv")
    .description("아이템을 폴더로 이동 (또는 inbox로)")
    .argument("<itemId>", "아이템 ID")
    .argument("[folderId]", "대상 폴더 ID (생략하면 inbox)")
    .action(async (itemId: string, folderId: string | undefined) => {
      const ctx = await openCli();
      try {
        const target = folderId ?? null;
        const moved = await moveItem(ctx.store, itemId, target);
        if (!moved) {
          process.stderr.write(`item not found: ${itemId}\n`);
          process.exit(1);
        }
        process.stdout.write(
          `moved ${moved.id} → ${moved.folder_id ?? "(inbox)"}\n`
        );
      } finally {
        ctx.adapter.close();
      }
    });
}
