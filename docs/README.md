# Flux 문서

## 구조

```
flux/
├── CLAUDE.md                   Claude Code가 세션마다 자동 로드
├── docs/
│   ├── README.md               이 파일 — 문서 지도
│   ├── requirements/           요구사항
│   ├── features/               기능 명세
│   ├── design-system/          디자인 시스템 (색·타이포·컴포넌트)
│   ├── screens/                화면 설계 (UI + 기능 통합)
│   ├── memory/                 AI·사람 작업 맥락 자산
│   │   ├── essences/           원재료 (사람은 직접 읽을 필요 없음)
│   │   ├── prompts/            병렬 실행 프롬프트 (worktree용)
│   │   └── context/            세션 기록 (MMDD.md)
│   ├── 스택.md                 기술 선택 + 플랫폼 우선순위
│   ├── 아키텍처.md             시스템 구조 + 데이터 흐름
│   ├── 인프라.md               환경·배포·환경변수
│   ├── 파일구조.md             모노레포 구조·의존 방향
│   ├── 테스트.md               테스트 전략·현황
│   ├── 트러블슈팅.md           문제 해결 기록
│   └── 개발현황.md             진행 마일스톤
├── .claude/                    Claude Code 설정 (git 공유)
│   ├── agents/                 서브에이전트 정의
│   └── rules/                  AI 제약 규칙
├── apps/                       web · desktop · mobile · backend
└── packages/                   shared · api-client · store · editor-core · ui
```

## 독자별

| 성격 | 위치 | 읽는 주체 |
|---|---|---|
| 결정·명세 (사람이 읽고 결정) | `docs/` 루트 md + `requirements`·`features`·`design-system`·`screens` | 팀원·신입 |
| AI 자동 참조 | `CLAUDE.md` + `.claude/` | Claude Code 세션 시작 시 자동 로드 |
| AI 맥락 자산 (memory) | `docs/memory/` | AI가 필요할 때 수동 주입 |

## 빠른 찾기

**프로젝트 이해**
- 왜 만드나 → `memory/essences/앱-재정의.md`
- 뭘 해야 하나 → `requirements/요구사항.md`

**기술 결정**
- 스택·플랫폼 → `스택.md`
- 시스템 구조 → `아키텍처.md`
- 파일 배치 → `파일구조.md`
- 배포·환경 → `인프라.md`
- 테스트 전략 → `테스트.md`

**제품 정의**
- 기능 → `features/`
- 화면 → `screens/`
- 디자인 → `design-system/디자인.md`

**작업**
- 지금 뭐 → `개발현황.md`
- 세션 기록 → `memory/context/MMDD.md`
- 병렬 프롬프트 → `memory/prompts/`
- 문제 기록 → `트러블슈팅.md`

## 문서 추가할 때

- 결정된 기준 → `docs/` 루트 md (스택 바뀌면 스택.md, 인프라 바뀌면 인프라.md)
- 원재료·브레인덤프 → `memory/essences/<도메인>/`
- 세션 기록 → `memory/context/MMDD.md` (context-writer가 자동 생성)
- 병렬 작업 프롬프트 → `memory/prompts/` (feature-decomposer + prompt-builder 조합)
- 새 축 문서 추가 시 이 README의 구조 트리·빠른 찾기에도 반영
