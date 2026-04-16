# 세션 ID 추출 로직

Sub-Agent에서 Claude Code 대화 세션 ID를 자동으로 추출하는 방법

---

## 🎯 목표

TodoWrite마다 새 "세션"을 만드는 대신, **실제 대화 세션별로 그룹화**

```
잘못된 방식:
SESSION: 04:13:05  ← TodoWrite 1
SESSION: 04:16:25  ← TodoWrite 2 (같은 대화인데!)

올바른 방식:
SESSION: 73f472cd-1e45-4150-9711-82f3468a7276
  - TodoWrite 04:13:05
  - TodoWrite 04:16:25
  - TodoWrite 04:17:11
```

---

## 📂 세션 ID 위치

### Claude Code 프로젝트 구조
```
/home/jun/.claude/projects/
└── -home-jun-8-August-electron/
    ├── 73f472cd-1e45-4150-9711-82f3468a7276.jsonl  ← 현재 세션
    ├── abc123de-4567-89ab-cdef-0123456789ab.jsonl  ← 다른 세션
    └── ...
```

**파일명 = 세션 ID (UUID)**

---

## 🔍 세션 ID 추출 알고리즘

### Step 1: 프로젝트 디렉토리 찾기
```bash
# 현재 작업 디렉토리 기반
PROJECT_PATH=$(pwd)  # /home/jun/8_August/electron

# Claude 프로젝트 디렉토리로 변환
# /home/jun/8_August/electron → -home-jun-8-August-electron
PROJECT_DIR=$(echo "$PROJECT_PATH" | sed 's|/|-|g')

# 최종 경로
SESSIONS_DIR="/home/jun/.claude/projects/$PROJECT_DIR"
```

### Step 2: 현재 세션 파일 찾기

#### 방법 A: 최근 수정된 파일
```bash
# 가장 최근에 수정된 .jsonl 파일
CURRENT_SESSION=$(ls -t $SESSIONS_DIR/*.jsonl | head -1)

# 세션 ID 추출
SESSION_ID=$(basename "$CURRENT_SESSION" .jsonl)
```

**장점**: 빠르고 간단
**단점**: 다른 세션을 열어둔 경우 오작동 가능

#### 방법 B: 내용 기반 검색 (권장)
```bash
# 현재 대화의 특정 키워드로 검색
# 예: 첫 메시지 내용
KEYWORD="이전 세션이 날아가서"

# 해당 키워드를 포함한 세션 파일 찾기
CURRENT_SESSION=$(grep -l "$KEYWORD" $SESSIONS_DIR/*.jsonl 2>/dev/null | head -1)

# 세션 ID 추출
SESSION_ID=$(basename "$CURRENT_SESSION" .jsonl)
```

**장점**: 확실한 현재 세션 식별
**단점**: 약간 느림 (파일 내용 검색)

#### 방법 C: 환경 변수 (이상적)
```bash
# Claude Code가 환경 변수로 제공한다면
SESSION_ID=$CLAUDE_SESSION_ID
```

**장점**: 가장 정확하고 빠름
**단점**: Claude Code가 제공하지 않을 수 있음

---

## 💻 Sub-Agent 구현 예시

### Bash 기반
```bash
#!/bin/bash

# 1. 프로젝트 디렉토리 찾기
PROJECT_PATH=$(pwd)
PROJECT_DIR=$(echo "$PROJECT_PATH" | sed 's|/|-|g')
SESSIONS_DIR="/home/jun/.claude/projects/$PROJECT_DIR"

# 2. 세션 ID 추출
SESSION_FILE=$(ls -t $SESSIONS_DIR/*.jsonl 2>/dev/null | head -1)

if [ -f "$SESSION_FILE" ]; then
    SESSION_ID=$(basename "$SESSION_FILE" .jsonl)

    # 3. 짧은 ID (선택적)
    SHORT_ID=$(echo "$SESSION_ID" | cut -c1-8)

    echo "SESSION: $SESSION_ID"
    echo "SHORT: $SHORT_ID"
else
    # 세션 ID를 찾을 수 없는 경우 타임스탬프 사용
    SESSION_ID="unknown-$(date +%Y%m%d-%H%M%S)"
    echo "SESSION: $SESSION_ID (fallback)"
fi
```

### Python 기반
```python
import os
import glob
from pathlib import Path

def get_session_id():
    """현재 Claude Code 세션 ID 추출"""

    # 1. 프로젝트 경로
    project_path = os.getcwd()
    project_dir = project_path.replace('/', '-')

    # 2. 세션 디렉토리
    sessions_dir = f"/home/jun/.claude/projects/{project_dir}"

    # 3. 최근 세션 파일
    session_files = glob.glob(f"{sessions_dir}/*.jsonl")

    if session_files:
        # 수정 시간 기준 정렬
        latest_session = max(session_files, key=os.path.getmtime)
        session_id = Path(latest_session).stem
        return session_id
    else:
        # Fallback
        from datetime import datetime
        return f"unknown-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

# 사용 예시
session_id = get_session_id()
short_id = session_id[:8]  # 처음 8자만

print(f"SESSION: {session_id}")
print(f"SHORT: {short_id}")
```

---

## 📝 출력 포맷 예시

### 전체 세션 ID 사용
```markdown
## ═══════════════════════════════════════════════
## SESSION: 73f472cd-1e45-4150-9711-82f3468a7276
## Started: 2025-10-19 04:13:05
## ═══════════════════════════════════════════════
```

**장점**: 완전히 고유함
**단점**: 너무 길어서 가독성 떨어짐

### 짧은 ID 사용 (권장)
```markdown
## ═══════════════════════════════════════════════
## SESSION: 73f472cd
## Started: 2025-10-19 04:13:05
## Full ID: 73f472cd-1e45-4150-9711-82f3468a7276
## ═══════════════════════════════════════════════
```

**장점**: 가독성 좋음
**단점**: 충돌 가능성 (하루 내에는 거의 없음)

### 의미 있는 제목 추가 (최선)
```markdown
## ═══════════════════════════════════════════════
## SESSION: 73f472cd - "이전 세션이 날아가서..."
## Started: 2025-10-19 04:13:05
## ═══════════════════════════════════════════════
```

**장점**: 세션 내용 한눈에 파악
**단점**: 제목 추출 로직 필요

---

## 🔄 세션 추적 워크플로우

### 1. 새 세션 시작
```
TodoWrite 실행
    ↓
세션 ID 추출 (73f472cd)
    ↓
파일 확인: 오늘 날짜 파일에 이 세션 ID 있나?
    ↓
없으면: 새 세션 헤더 생성
있으면: 기존 세션에 TodoWrite 추가
```

### 2. 기존 세션에 TodoWrite 추가
```markdown
## SESSION: 73f472cd
## Started: 2025-10-19 04:13:05

### TodoWrite 04:13:05
- Task 1
- Task 2

### TodoWrite 04:16:25  ← 같은 세션에 추가
- Task 3
- Task 4
```

### 3. 새 세션 시작 감지
```
다음 날 또는 새 대화 시작
    ↓
세션 ID 변경 감지 (abc123de)
    ↓
새 세션 헤더 생성
```

---

## ⚠️ Edge Cases 처리

### Case 1: 세션 ID를 찾을 수 없음
```python
if not session_id:
    # Fallback: 타임스탬프 기반 ID
    session_id = f"fallback-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
```

### Case 2: 여러 프로젝트가 동시에 열림
```python
# 현재 프로젝트 경로로 필터링
project_path = os.getcwd()
# 해당 프로젝트의 세션만 찾기
```

### Case 3: 세션 파일이 삭제됨
```python
# 이전 기록에서 세션 ID 재사용
# 또는 새 Fallback ID 생성
```

---

## 🎯 Sub-Agent 통합

### todo-logger.md 에이전트 업데이트
```yaml
---
name: todo-logger
description: TodoList 자동 기록 (세션 ID 추적 포함)
---

## Core Responsibilities

1. **Session ID Extraction**:
   - Find current project directory
   - Locate most recent .jsonl file
   - Extract UUID from filename
   - Use as session identifier

2. **Session Grouping**:
   - Check if session ID already in today's file
   - If exists: Append to existing session
   - If new: Create new session header

3. **TodoList Recording**:
   - Group by session ID
   - Track TodoWrite timestamps within session
   - Maintain chronological order
```

---

## 📊 예상 결과

### Before (잘못된 방식)
```
2025-10-19.md에 7개 "세션":
- SESSION: 04:13:05
- SESSION: 04:16:25
- SESSION: 04:17:11
- SESSION: 13:36:53
...
```

### After (올바른 방식)
```
2025-10-19.md에 2개 세션:
- SESSION: 73f472cd (새벽, 3 TodoWrites)
- SESSION: abc123de (오후, 4 TodoWrites)
```

**개선 효과**:
- ✅ 의미 있는 세션 구분
- ✅ 같은 대화 맥락 유지
- ✅ 더 나은 컨텍스트 추적

---

**작성일**: 2025-10-19
**목적**: Sub-Agent에서 세션 ID 자동 추출
**작성자**: Claude (Sonnet 4.5)
