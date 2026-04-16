# Sub-Agent 전환 가이드

Sub-Agent 방식으로 전환 시 삭제/수정해야 할 파일 및 내용 정리

---

## 📋 현재 방식 (RULES.md)에서 사용 중인 파일

### 1. `/home/jun/.claude/RULES.md` (라인 9-17)
```markdown
- **MANDATORY**: After every TodoWrite, automatically record to `/home/jun/.claude/todo-history/YYYY-MM-DD.md`
  - Use TodoRead to get current state
  - Detect language per task (check for Korean characters)
  - Format: session timestamp + emoji status (✅ completed, 🔄 in_progress, 📋 pending, 🚧 blocked)
  - Language handling:
    * Korean tasks: Record Korean only
    * English tasks: Record BOTH English (original) and Korean (translation)
  - Check for duplicates (compare content hash)
  - Process quietly, only show "✅ Recorded: N tasks" confirmation
```

**역할**: Claude에게 "직접" 기록 작업을 수행하라고 지시
**문제**: Claude가 Edit/Write tool을 직접 사용 → 사용자 승인 필요

---

## 🎯 Sub-Agent 방식에서 필요한 파일

### 1. `/home/jun/.claude/agents/todo-logger.md`
```yaml
name: todo-logger
description: TodoList 자동 기록 전용 agent
model: sonnet
```

**역할**: 독립적인 sub-agent로 기록 처리
**장점**: Agent 내부에서 Edit/Write 사용 → 승인 불필요

### 2. `/home/jun/.claude/RULES.md` (수정 버전)
```markdown
- **MANDATORY**: After every TodoWrite, call todo-logger agent via Task tool
  - Example: Task(description="Record TodoList", prompt="Log current TodoList to history file", subagent_type="todo-logger")
  - Process quietly, only show "✅ Recorded: N tasks" confirmation from agent
```

**역할**: Claude에게 "Task tool 호출"만 지시
**개선**: 구체적인 기록 로직은 agent에게 위임

---

## 🗑️ 삭제/수정할 내용

### RULES.md에서 제거할 내용

#### ❌ 삭제할 부분 (라인 10-16)
```markdown
  - Use TodoRead to get current state
  - Detect language per task (check for Korean characters)
  - Format: session timestamp + emoji status (✅ completed, 🔄 in_progress, 📋 pending, 🚧 blocked)
  - Language handling:
    * Korean tasks: Record Korean only
    * English tasks: Record BOTH English (original) and Korean (translation)
  - Check for duplicates (compare content hash)
```

**이유**: 이 로직은 모두 `todo-logger.md` agent에 구현되어 있음

#### ✅ 유지할 부분 (라인 9, 17)
```markdown
- **MANDATORY**: After every TodoWrite, [수정 필요]
  - Process quietly, only show "✅ Recorded: N tasks" confirmation
```

**이유**: "언제 호출할지"와 "출력 형식"은 여전히 필요

---

## 📝 전환 후 RULES.md (최종안)

### Before (현재)
```markdown
### Task Management Rules
- TodoRead() → TodoWrite(3+ tasks) → Execute → Track progress
- **MANDATORY**: After every TodoWrite, automatically record to `/home/jun/.claude/todo-history/YYYY-MM-DD.md`
  - Use TodoRead to get current state
  - Detect language per task (check for Korean characters)
  - Format: session timestamp + emoji status (✅ completed, 🔄 in_progress, 📋 pending, 🚧 blocked)
  - Language handling:
    * Korean tasks: Record Korean only
    * English tasks: Record BOTH English (original) and Korean (translation)
  - Check for duplicates (compare content hash)
  - Process quietly, only show "✅ Recorded: N tasks" confirmation
```

### After (Sub-Agent 전환 후)
```markdown
### Task Management Rules
- TodoRead() → TodoWrite(3+ tasks) → Execute → Track progress
- **MANDATORY**: After every TodoWrite, call todo-logger agent via Task tool
  - The agent will handle: language detection, translation, formatting, file management
  - Process quietly, agent returns "✅ Recorded: N tasks" confirmation
```

**변경 사항**:
- ❌ 제거: 구체적인 구현 로직 (7줄)
- ✅ 추가: Task tool 호출 지시 (1줄)
- ✅ 유지: 출력 형식 (1줄)

**결과**: 9줄 → 3줄 (67% 감소)

---

## 🔄 마이그레이션 단계

### Step 1: Agent 파일 준비
```bash
# 이미 완료됨
cp /home/jun/.claude/agents/archive/todo-logger.md.bak \
   /home/jun/.claude/agents/todo-logger.md
```

### Step 2: RULES.md 백업
```bash
cp /home/jun/.claude/RULES.md \
   /home/jun/.claude/RULES.md.backup-$(date +%Y%m%d)
```

### Step 3: RULES.md 수정

**삭제할 라인**: 10-16 (7줄)
**수정할 라인 9**:
```markdown
# Before
- **MANDATORY**: After every TodoWrite, automatically record to `/home/jun/.claude/todo-history/YYYY-MM-DD.md`

# After
- **MANDATORY**: After every TodoWrite, call todo-logger agent via Task tool
```

**추가할 라인 10**:
```markdown
  - The agent will handle: language detection, translation, formatting, file management
```

### Step 4: 테스트
1. TodoWrite 실행
2. Task tool 호출 확인
3. todo-logger agent 실행 확인
4. 파일 기록 확인

### Step 5: 백업 파일 정리 (선택)
```bash
# 1주일 후 문제없으면 삭제
rm /home/jun/.claude/RULES.md.backup-YYYYMMDD
```

---

## 📊 파일 변경 요약

| 파일 | 변경 타입 | 내용 |
|------|----------|------|
| `/home/jun/.claude/RULES.md` | 수정 | 라인 9-17 → 9-10 (간소화) |
| `/home/jun/.claude/agents/todo-logger.md` | 추가 | archive에서 복원 (이미 완료) |
| `/home/jun/.claude/todo-history/` | 유지 | 변경 없음 (데이터 보존) |
| Migration Kit 파일들 | 삭제 가능 | 더 이상 불필요 |

---

## 🗂️ Migration Kit 파일 정리

### 삭제 가능한 파일들

```bash
/home/jun/.claude/todo-logger-migration-kit/
├── README.md                  # ❌ 삭제 가능
├── QUICKSTART.md              # ❌ 삭제 가능
├── SUMMARY.md                 # ❌ 삭제 가능
├── FILELIST.txt               # ❌ 삭제 가능
├── install.sh                 # ❌ 삭제 가능
├── RULES.md.template          # ❌ 삭제 가능
├── settings.local.json.template # ❌ 삭제 가능
└── example-output.md          # ❌ 삭제 가능
```

**이유**:
- RULES.md 방식용 문서들
- Sub-Agent 방식에서는 불필요
- Agent 파일만 있으면 됨

### 삭제 명령어
```bash
# 전체 Migration Kit 디렉토리 삭제
rm -rf /home/jun/.claude/todo-logger-migration-kit

# 압축 파일도 삭제
rm -f /home/jun/.claude/todo-logger-migration-kit.tar.gz
rm -f /home/jun/.claude/todo-logger-migration-kit.zip
```

---

## ✅ 최종 파일 구조

### Sub-Agent 방식 (최종)
```
/home/jun/.claude/
├── RULES.md                    # ✅ 간소화 (3줄)
├── agents/
│   └── todo-logger.md          # ✅ Sub-agent
└── todo-history/
    ├── 2025-10-11.md           # ✅ 기존 데이터 유지
    ├── 2025-10-16.md
    ├── 2025-10-18.md
    └── 2025-10-19.md
```

**총 파일 수**: 3개 (RULES.md + agent + history 디렉토리)

### 삭제된 것들
```
❌ todo-logger-migration-kit/ (전체 디렉토리)
❌ *.tar.gz, *.zip (압축 파일)
❌ RULES.md의 구현 로직 (7줄)
```

---

## 🎯 장점 정리

### 코드 간소화
```
Before: RULES.md 9줄 (구현 로직 포함)
After:  RULES.md 3줄 (호출 지시만)
        Agent 파일 (독립적 관리)

결과: 관심사의 분리 (Separation of Concerns)
```

### 유지보수성
```
로직 수정 필요 시:
Before: RULES.md 수정 → 모든 프로젝트 영향
After:  Agent 파일만 수정 → 독립적
```

### 재사용성
```
Before: RULES.md에 강하게 결합
After:  Agent 파일만 복사하면 이식 가능
```

---

## 🚨 주의사항

### 1. 기존 데이터 보존
```bash
# todo-history는 절대 삭제하지 말 것!
/home/jun/.claude/todo-history/  # ✅ 유지
```

### 2. RULES.md 백업
```bash
# 수정 전 반드시 백업
cp RULES.md RULES.md.backup
```

### 3. 점진적 전환
```
1. Agent 파일 준비 ✅ (완료)
2. RULES.md 백업
3. RULES.md 수정
4. 테스트
5. Migration Kit 삭제
```

### 4. 롤백 계획
```bash
# 문제 발생 시 복원
cp RULES.md.backup RULES.md
rm /home/jun/.claude/agents/todo-logger.md
```

---

## 📚 참고 문서

- **현재 설계**: `/mnt/c/Users/jjy84/Desktop/리서치 프로젝트/TodoLogger_최종설계.md`
- **이전 작업**: `/mnt/c/Users/jjy84/Desktop/리서치 프로젝트/Todo. 1018.txt`
- **Agent 원본**: `/home/jun/.claude/agents/archive/todo-logger.md.bak`

---

**작성일**: 2025-10-19
**목적**: Sub-Agent 전환 시 삭제/수정 가이드
**작성자**: Claude (Sonnet 4.5)
