# Phase 2 · packages/editor-core 세션 프롬프트

너는 flux 모노레포의 `@flux/editor-core` 패키지를 구현한다. 이 세션은 **이 패키지만** 건드린다.

## 맥락 로드

1. `CLAUDE.md`
2. `docs/아키텍처.md` — 데이터 모델 · 동기화 (CRDT delta)
3. `docs/스택.md` — 실시간 편집 엔진: loro 섹션
4. `packages/shared/src/*.ts` — Document, WsMessage(crdt_delta), ItemEmbed
5. loro-crdt 공식 문서 (필요 시)

## 목표

loro CRDT 기반 리치텍스트 에디터의 **코어 로직**. React·Tauri·RN에 독립적인 순수 TS 레이어. 각 플랫폼은 이 코어를 호출해서 UI에 바인딩한다.

## 범위

**포함:**
- `FluxDoc` — loro 문서 래퍼. `create()`, `load(bytes)`, `exportSnapshot()`, `exportDelta(fromVersion)`, `importDelta(delta)`
- 텍스트 편집 연산: `insertText(path, offset, text)`, `deleteText(path, offset, length)`, `applyMarks(range, marks)` (bold/italic 등)
- 아이템 임베드 연산: `embedItem(position, itemId)`, `removeEmbed(position)`. ItemEmbed는 내부 트리 노드로 표현
- 이벤트 구독: `subscribe(handler)` — 변경 때마다 delta를 handler에 전달 (WsMessage(crdt_delta) 송신용)
- 실행 취소/되돌리기: `undo()`, `redo()` (loro 내장)
- 직렬화: `toJSON()` — 테스트 비교용 평탄 구조
- Undo/Redo 스택 크기 제한 (메모리 관리)

**제외:**
- UI 렌더링 (editor-core는 headless)
- 네트워크 송수신 (`packages/api-client`가 delta 전송)
- SQLite 저장 (`packages/store`가 crdt_doc blob 저장)
- React/Tauri/RN 바인딩 (apps가 이 코어를 래핑)

## 절대 규칙

- **`packages/shared/` 수정 금지.** Phase 1 잠김.
- **다른 패키지(api-client·store·ui) 수정 금지.**
- **apps/ 수정 금지.**
- 플랫폼 API(window·DOM·RN) 사용 금지. 순수 TS + loro-crdt만.

## TDD

1. 테스트 먼저 — 편집 연산 단위, 동시 편집 병합, undo/redo 경로
2. 속성 기반 테스트 권장 (`fast-check`): 무작위 편집 시퀀스의 결정성·수렴성 검증
3. 커버리지 80%+

CRDT 핵심인 **동시 편집 후 수렴** 시나리오를 최소 3개 테스트로 포함: 두 `FluxDoc`이 같은 초기 상태에서 서로 다른 편집 후 delta 교환 시 최종 상태가 같음.

## 의존성

```bash
pnpm add -F @flux/editor-core @flux/shared loro-crdt
pnpm add -F @flux/editor-core -D vitest fast-check
```

## 산출물

```
packages/editor-core/
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── src/
    ├── index.ts
    ├── flux-doc.ts + flux-doc.test.ts      (FluxDoc 래퍼)
    ├── text-ops.ts + text-ops.test.ts      (insertText·deleteText·applyMarks)
    ├── embed-ops.ts + embed-ops.test.ts    (embedItem·removeEmbed)
    ├── subscribe.ts + subscribe.test.ts    (이벤트/delta 방출)
    ├── history.ts + history.test.ts        (undo/redo)
    └── convergence.test.ts                 (속성 기반 동시 편집 수렴 테스트)
```

## 완료 조건

- `pnpm -F @flux/editor-core test` 통과
- `pnpm -F @flux/editor-core exec tsc --noEmit` 에러 0
- 수렴성 테스트: 서로 다른 편집 시퀀스를 교환한 두 FluxDoc의 `toJSON()`이 일치
- `exportSnapshot()` 결과를 `load()`로 복원하면 동일 상태

## 마무리

완료 후 `docs/개발현황.md`의 Phase 2 표에서 editor-core 항목을 ✅로 갱신.
