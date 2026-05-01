import type { Command } from "commander";
import type { Store } from "@flux/store";
import type { ItemType } from "@flux/shared";
import type { CliContext } from "../db";

export type SearchHit =
  | { kind: "item"; id: string; type: ItemType; snippet: string }
  | { kind: "doc"; id: string; title: string };

export interface SearchInput {
  query: string;
  mode: "keyword" | "semantic";
  limit?: number;
}

const DEFAULT_LIMIT = 20;
const SNIPPET_LEN = 80;

export async function searchAll(
  store: Store,
  input: SearchInput
): Promise<SearchHit[]> {
  if (input.mode === "semantic") {
    throw new Error("semantic mode not implemented");
  }
  const limit = input.limit ?? DEFAULT_LIMIT;
  if (limit <= 0 || input.query.length === 0) return [];

  const items = await store.items.search(input.query);
  const docs = await store.documents.searchByTitle(input.query);

  const hits: SearchHit[] = [];
  for (const it of items) {
    hits.push({
      kind: "item",
      id: it.id,
      type: it.type,
      snippet: it.content.slice(0, SNIPPET_LEN),
    });
  }
  for (const d of docs) {
    hits.push({ kind: "doc", id: d.id, title: d.title });
  }
  return hits.slice(0, limit);
}

export function formatSearchHit(hit: SearchHit): string {
  if (hit.kind === "item") {
    return `[item] ${hit.id}  ${hit.snippet}`;
  }
  return `[doc] ${hit.id}  ${hit.title}`;
}

export function formatSearchHits(hits: SearchHit[], query: string): string {
  if (hits.length === 0) return `(no results for "${query}")`;
  return hits.map(formatSearchHit).join("\n");
}

export function runSemanticPlaceholder(): never {
  process.stderr.write("semantic mode not implemented\n");
  process.exit(1);
}

export function register(
  program: Command,
  openCli: () => Promise<CliContext>
): void {
  program
    .command("search")
    .description("키워드 검색 (FTS5). 의미 모드는 placeholder")
    .argument("<query>", "검색어")
    .option("--mode <mode>", "keyword|semantic", "keyword")
    .option("-n, --limit <count>", "결과 개수 제한", (v) => parseInt(v, 10))
    .action(async (query: string, opts) => {
      const mode = opts.mode as "keyword" | "semantic";
      if (mode !== "keyword" && mode !== "semantic") {
        process.stderr.write(`unknown mode: ${opts.mode}\n`);
        process.exit(1);
      }
      if (mode === "semantic") {
        runSemanticPlaceholder();
      }
      const ctx = await openCli();
      try {
        const hits = await searchAll(ctx.store, {
          query,
          mode,
          limit: opts.limit,
        });
        process.stdout.write(formatSearchHits(hits, query) + "\n");
      } finally {
        ctx.adapter.close();
      }
    });
}
