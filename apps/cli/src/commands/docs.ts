import type { Command } from "commander";
import type { Store } from "@flux/store";
import type { Document, ItemEmbed } from "@flux/shared";
import {
  FluxDoc,
  embedItem,
  insertText,
  listEmbeds,
  type EmbedEntry,
} from "@flux/editor-core";
import type { CliContext } from "../db";

export interface CreateDocInput {
  title?: string;
  folderId?: string | null;
}

export interface ListDocsInput {
  folderId?: string | null;
}

export interface DocShowResult {
  document: Document;
  text: string;
  embeds: EmbedEntry[];
}

export async function createDoc(
  store: Store,
  input: CreateDocInput
): Promise<Document> {
  const fluxDoc = FluxDoc.create();
  const snapshot = fluxDoc.exportSnapshot();
  return store.documents.insert({
    title: input.title ?? "",
    crdt_doc: snapshot,
    folder_id: input.folderId ?? null,
  });
}

export async function listDocs(
  store: Store,
  input?: ListDocsInput
): Promise<Document[]> {
  return store.documents.findAll(
    input?.folderId !== undefined ? { folderId: input.folderId } : undefined
  );
}

export async function embedToDoc(
  store: Store,
  docId: string,
  itemId: string
): Promise<{ document: Document; embed: ItemEmbed } | null> {
  const document = await store.documents.findById(docId);
  if (!document) return null;
  const item = await store.items.findById(itemId);
  if (!item) return null;

  // embedItem은 같은 itemId가 이미 있으면 CRDT를 갱신하지 않는다.
  // SQL 쪽도 row를 추가하지 않도록 먼저 확인해 양쪽 상태를 일치시킨다.
  const existing = await store.embeds.findByDocument(docId);
  const dup = existing.find((e) => e.item_id === itemId);
  if (dup) return { document, embed: dup };

  const fluxDoc = loadOrCreate(document.crdt_doc);
  const position = listEmbeds(fluxDoc).length;
  embedItem(fluxDoc, position, itemId);
  const snapshot = fluxDoc.exportSnapshot();

  const updated = await store.documents.update(docId, { crdt_doc: snapshot });
  if (!updated) return null;
  const embed = await store.embeds.insert({
    document_id: docId,
    item_id: itemId,
    position,
  });
  return { document: updated, embed };
}

export async function appendToDoc(
  store: Store,
  docId: string,
  text: string
): Promise<Document | null> {
  // 텍스트는 CRDT 컨테이너 끝(utf-16 길이)에 삽입해 단순 append 의미를 보존한다.
  const document = await store.documents.findById(docId);
  if (!document) return null;

  const fluxDoc = loadOrCreate(document.crdt_doc);
  const length = fluxDoc.getText().length;
  insertText(fluxDoc, "text", length, text);
  const snapshot = fluxDoc.exportSnapshot();

  return store.documents.update(docId, { crdt_doc: snapshot });
}

export async function showDoc(
  store: Store,
  docId: string
): Promise<DocShowResult | null> {
  const document = await store.documents.findById(docId);
  if (!document) return null;
  const fluxDoc = loadOrCreate(document.crdt_doc);
  const text = fluxDoc.getText().toString();
  const embeds = listEmbeds(fluxDoc);
  return { document, text, embeds };
}

function loadOrCreate(snapshot: Uint8Array): FluxDoc {
  if (snapshot.byteLength === 0) {
    return FluxDoc.create();
  }
  return FluxDoc.load(snapshot);
}

export function formatDoc(doc: Document): string {
  const title = doc.title.length > 0 ? doc.title : "(untitled)";
  return `${doc.id} ${doc.updated_at} ${title}`;
}

export function formatDocList(docs: Document[]): string {
  if (docs.length === 0) return "(no docs)";
  return docs.map(formatDoc).join("\n");
}

export function formatDocShow(result: DocShowResult): string {
  const title =
    result.document.title.length > 0 ? result.document.title : "(untitled)";
  const lines: string[] = [];
  lines.push(`# ${title}  (${result.document.id})`);
  lines.push("");
  lines.push(result.text);
  lines.push("");
  lines.push("embeds:");
  if (result.embeds.length === 0) {
    lines.push("  (none)");
  } else {
    for (const e of result.embeds) {
      lines.push(`  ${e.position}: ${e.item_id}`);
    }
  }
  return lines.join("\n");
}

export function register(
  program: Command,
  openCli: () => Promise<CliContext>
): void {
  const docsCmd = program
    .command("docs")
    .description("노트 관리 (new / ls / embed / append / show)");

  docsCmd
    .command("new")
    .description("빈 노트 생성")
    .option("--title <title>", "제목")
    .option("--folder <id>", "대상 폴더 ID")
    .action(async (opts) => {
      const ctx = await openCli();
      try {
        const doc = await createDoc(ctx.store, {
          title: opts.title,
          folderId: opts.folder ?? null,
        });
        process.stdout.write(`created ${doc.id}\n`);
      } finally {
        ctx.adapter.close();
      }
    });

  docsCmd
    .command("ls")
    .description("노트 목록")
    .option("--folder <id>", "폴더 필터 (생략하면 전체)")
    .action(async (opts) => {
      const ctx = await openCli();
      try {
        const docs = await listDocs(
          ctx.store,
          opts.folder !== undefined ? { folderId: opts.folder } : undefined
        );
        process.stdout.write(formatDocList(docs) + "\n");
      } finally {
        ctx.adapter.close();
      }
    });

  docsCmd
    .command("embed")
    .description("노트에 아이템 임베드")
    .argument("<docId>", "노트 ID")
    .argument("<itemId>", "아이템 ID")
    .action(async (docId: string, itemId: string) => {
      const ctx = await openCli();
      try {
        const result = await embedToDoc(ctx.store, docId, itemId);
        if (!result) {
          process.stderr.write(`doc or item not found\n`);
          process.exit(1);
        }
        process.stdout.write(
          `embedded ${result.embed.item_id} → ${result.document.id} @${result.embed.position}\n`
        );
      } finally {
        ctx.adapter.close();
      }
    });

  docsCmd
    .command("append")
    .description("노트 끝에 텍스트 추가")
    .argument("<docId>", "노트 ID")
    .argument("<text>", "추가할 텍스트")
    .action(async (docId: string, text: string) => {
      const ctx = await openCli();
      try {
        const updated = await appendToDoc(ctx.store, docId, text);
        if (!updated) {
          process.stderr.write(`doc not found: ${docId}\n`);
          process.exit(1);
        }
        process.stdout.write(`appended ${updated.id}\n`);
      } finally {
        ctx.adapter.close();
      }
    });

  docsCmd
    .command("show")
    .description("노트 출력 (텍스트 + 임베드)")
    .argument("<docId>", "노트 ID")
    .action(async (docId: string) => {
      const ctx = await openCli();
      try {
        const result = await showDoc(ctx.store, docId);
        if (!result) {
          process.stderr.write(`doc not found: ${docId}\n`);
          process.exit(1);
        }
        process.stdout.write(formatDocShow(result) + "\n");
      } finally {
        ctx.adapter.close();
      }
    });
}
