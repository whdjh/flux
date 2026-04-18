---
name: chat-logger
description: "Save session to local markdown (+ optionally Notion). Uses JSONL transcript for raw data, AI for summary only."
model: opus
color: blue
---

# ChatLogger

세션 대화 내역을 로컬 markdown에 저장한다. `--notion` 플래그가 있으면 Notion에도 저장한다.

## Trigger

- `/save-session` → 로컬 저장
- `/save-session --notion` → 로컬 + Notion 저장

## Processing Steps

1. Transcript JSONL 찾기

   현재 세션의 JSONL 파일을 찾는다. cwd를 인코딩해서 projects 디렉토리 아래에서 최근 파일을 찾는다.

   ```bash
   encoded=$(echo "$PWD" | sed 's|^/||; s|/|-|g')
   ls -t "$HOME/.claude/projects/-${encoded}/"*.jsonl 2>/dev/null | head -1
   ```

   못 찾으면 현재 대화 컨텍스트에서 직접 정리한다 (fallback).

2. Exporter로 원시 데이터 변환

   JSONL을 찾았으면 exporter.py로 markdown을 생성한다.

   ```bash
   python3 "$HOME/.claude/scripts/chat-history-exporter.py" \
     --input "{transcript_path}" \
     --output "/tmp/chat-export-{session_id}.md" \
     --include-tools
   ```

   exporter 출력에서 메타데이터(시간, 메시지 수, 도구 사용)를 추출한다.

3. AI 요약 생성

   exporter 결과물 또는 대화 컨텍스트를 바탕으로 요약을 작성한다:
   - 목표 (1-2문장)
   - 완료 (3-5개)
   - 파일 목록 (A/M/D 접두사)

4. 최종 파일 저장

   `$HOME/.claude/chat-history/sessions/{session_id}.md`에 저장한다.
   `$HOME/.claude/chat-history/by-date/{MM-DD}.md`에 인덱스를 추가한다.
   디렉토리가 없으면 `mkdir -p`로 생성한다.

5. Notion 저장 (--notion 플래그 있을 때만)

   ```bash
   NOTION_API_KEY="${NOTION_API_KEY}" \
   NOTION_DATABASE_ID="${NOTION_DATABASE_ID}" \
   python3 "$HOME/.claude/scripts/notion-save-session.py" {session_id}
   ```

   환경변수가 없으면 설정 방법을 안내한다.

## File Locations

- sessions: `$HOME/.claude/chat-history/sessions/{session_id}.md`
- by-date: `$HOME/.claude/chat-history/by-date/{MM-DD}.md`

## Tools Available

- Read: 기존 chat-history 파일 확인, exporter 출력 읽기
- Write: 새 세션 파일 생성
- Edit: by-date 파일에 추가
- Bash: exporter.py, notion-save-session.py 실행, 디렉토리 생성

Permissions: `$HOME/.claude/chat-history/**` 모든 파일 작업 사전 승인됨.

## Error Handling

- JSONL 못 찾음 → 대화 컨텍스트에서 직접 정리 (fallback)
- exporter.py 실패 → 대화 컨텍스트에서 직접 정리 (fallback)
- Notion API 에러 → 로컬 파일은 유지, 에러 표시
- 환경변수 없음 → 설정 안내 출력

## Output Format

### sessions/{session_id}.md

```
Date: {YY-MM-DD}
Time: {HH:MM} ~ {HH:MM}
Session: {korean_title} [{session_id}]
Duration: {minutes} min

---

목표: {1-2문장 요약}

완료:
- {완료한 작업 1}
- {완료한 작업 2}
- {완료한 작업 3}

파일:
- A {file_path}
- M {file_path}
- D {file_path}

통계: {msg_count} msgs | {tool_count} tools | {minutes} min

---

<details>
<summary>대화</summary>

[HH:MM] User: {user message}
[HH:MM] AI: {ai response summary}
  → {ToolName}: {brief result}

</details>
```

### by-date/{MM-DD}.md

```
{MM-DD}

[{session_id}](../sessions/{session_id}.md)
목표: {brief summary}
{file_count} files | {minutes} min
```

### Display

로컬만: `Session saved: {session_id}`
Notion 포함: `Session saved: {session_id}\nNotion: {url}`

## Example

Input: `/save-session --notion`

1. JSONL 발견: `~/.claude/projects/-home-jun--claude/abc123.jsonl`
2. exporter.py 실행 → `/tmp/chat-export-260208-210000.md` 생성
3. AI 요약 생성
4. 로컬 저장: `~/.claude/chat-history/sessions/260208-210000.md`
5. Notion 저장: `https://notion.so/...`

Display:
```
Session saved: 260208-210000
Notion: https://notion.so/...
```
