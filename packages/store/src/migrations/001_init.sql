-- 001_init.sql
-- @flux/store 초기 스키마. 엔티티 5종 + FTS5 + 오프라인 큐.
-- 모든 쓰기는 로컬 SQLite에 먼저 들어가고, sync_queue를 통해 서버로 전파된다.

-- 마이그레이션 버전 추적
CREATE TABLE IF NOT EXISTS _migration (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

-- Folder (트리)
CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  parent_id TEXT,
  FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_folders_user ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);

-- Item (수집물)
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata TEXT,
  ai TEXT,
  created_at TEXT NOT NULL,
  sync_file INTEGER NOT NULL DEFAULT 0,
  folder_id TEXT,
  deleted_at TEXT,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_items_user ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_folder ON items(folder_id);
CREATE INDEX IF NOT EXISTS idx_items_created ON items(created_at);

-- Document (메모 · loro binary)
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  crdt_doc BLOB NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  folder_id TEXT,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_updated ON documents(updated_at);

-- Session (사용자 세션 · user vs ai 구분)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  created_by TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at);

-- ItemEmbed (Document ↔ Item 참조)
CREATE TABLE IF NOT EXISTS item_embeds (
  document_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  PRIMARY KEY (document_id, item_id, position),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_embeds_document ON item_embeds(document_id);
CREATE INDEX IF NOT EXISTS idx_embeds_item ON item_embeds(item_id);

-- FTS5: Item.content와 Document.title을 전문 검색 대상으로 등록
CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
  id UNINDEXED,
  content,
  tokenize = 'unicode61'
);

CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
  id UNINDEXED,
  title,
  tokenize = 'unicode61'
);

-- 오프라인 큐: 서버에 아직 반영되지 않은 변경을 대기열로 관리
-- entity: items | documents | folders | sessions | item_embeds
-- op: create | update | delete
-- payload: JSON으로 직렬화된 엔티티 또는 변경 내용
CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  op TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT
);
CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity, entity_id);
