# Phase 2 · packages/ui 세션 프롬프트

너는 flux 모노레포의 `@flux/ui` 패키지를 구현한다. 이 세션은 **이 패키지만** 건드린다.

## 맥락 로드

1. `CLAUDE.md`
2. `docs/design/디자인.md` — 원칙·색상·타이포·레이아웃·컴포넌트 스타일·접근성
3. `apps/frontend/web/src/app/globals.css` — 디자인 토큰 원본 (@theme, :root, .dark)
4. `apps/frontend/web/src/app/design-system/page.tsx` — 토큰을 쓰는 예시 (12단계 산출물)
5. `packages/shared/src/*.ts` — 타입만 참고. UI는 엔티티 타입 표시에 사용.

## 목표

웹과 데스크톱이 공유하는 React 컴포넌트 라이브러리. 디자인 토큰(globals.css의 CSS 변수)을 그대로 참조. 모바일(RN)은 별도 UI이므로 이 패키지 사용 안 함.

## 범위

**포함 (M0 기준, 최소한으로 시작):**
- `Button` — 4 variant(Primary·Secondary·Destructive·Ghost) × 3 size
- `Card` — Item 표시용. 썸네일·제목·메타
- `Input` — 텍스트 입력. Label·placeholder·error 상태
- `Tree` — 폴더 트리 (재귀). 확장/접기·선택
- `Icon` — SVG 기반. 크기는 `--icon-sm/md/lg` 참조
- `Chip` — 키워드·상태 표시
- `Tooltip` — 키보드 포커스 시에도 보임 (접근성)
- `SplitView` — 분할뷰 레이아웃. 드래그 리사이즈. 프리셋(1/2, 1/3, 1/4)

**제외:**
- 비즈니스 로직 (apps/frontend/web이 조립)
- 라우팅·SSR 관련 (Next.js 특화)
- 모바일 RN 컴포넌트 (별도 패키지나 apps/mobile 내부)
- 복잡한 에디터 UI (editor-core + apps 조합)

## 절대 규칙

- **`packages/shared/` 수정 금지.** Phase 1 잠김.
- **다른 패키지 수정 금지.**
- **apps/ 수정 금지.** (globals.css는 apps 것이지만 **읽기 전용 참조**만)
- 디자인 토큰을 직접 수정·재정의하지 않는다. `var(--primary)` 처럼 참조만.
- 하드코딩된 색·크기 금지. 모두 CSS 변수로.

## TDD

1. 테스트 먼저 — vitest + `@testing-library/react` + jsdom
2. 각 컴포넌트: 기본 렌더 · prop 변형 · 접근성(aria, 포커스) 
3. 커버리지 80%+

접근성 테스트는 최소 수준으로: 키보드 포커스, aria-label 존재, 대비(잠깐 런타임 컴퓨트 검증). 시각 회귀 테스트는 13단계(apps 개발)에서 Playwright로 본다.

## 의존성

```bash
pnpm add -F @flux/ui @flux/shared react
pnpm add -F @flux/ui -D vitest @testing-library/react @testing-library/jest-dom jsdom @types/react
```

## 산출물

```
packages/ui/
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── src/
    ├── index.ts
    ├── button.tsx + button.test.tsx
    ├── card.tsx + card.test.tsx
    ├── input.tsx + input.test.tsx
    ├── tree.tsx + tree.test.tsx
    ├── icon.tsx + icon.test.tsx
    ├── chip.tsx + chip.test.tsx
    ├── tooltip.tsx + tooltip.test.tsx
    └── split-view.tsx + split-view.test.tsx
```

## 완료 조건

- `pnpm -F @flux/ui test` 통과
- `pnpm -F @flux/ui exec tsc --noEmit` 에러 0
- 모든 색·간격·반경·모션이 globals.css 토큰(`var(--...)`) 참조
- 키보드 네비게이션 테스트 (Button·Input·Tree 최소)
- apps/frontend/web이 이 패키지를 import해서 `/design-system` 페이지를 점진 교체할 수 있는 구조

## 마무리

완료 후 `docs/개발현황.md`의 Phase 2 표에서 ui 항목을 ✅로 갱신.
