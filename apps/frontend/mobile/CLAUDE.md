# Flux Mobile

React Native Expo 기반 모바일 앱.
로직(store, api-client, editor-core)은 packages와 공유하고, UI는 네이티브로 자체 구현한다.

## 기술 스택

| 항목 | 선택 |
|---|---|
| 프레임워크 | React Native (Expo) |
| 라우팅 | Expo Router (파일 기반) |
| 스타일 | NativeWind (Tailwind for RN) |
| 상태 관리 | `@flux/store` (Zustand) |
| 에디터 | `@flux/editor-core` (코어 로직) + 네이티브 렌더러 |

## 디렉토리

```
mobile/
├── app/                  # Expo Router (파일 기반 라우팅)
│   ├── (tabs)/           #   탭 네비게이션
│   ├── note/[id].tsx     #   노트 상세
│   └── _layout.tsx       #   루트 레이아웃
├── src/
│   ├── features/         # FSD features (모바일 UI 구현)
│   ├── entities/         # FSD entities (모바일 UI 표현)
│   └── shared/           # 모바일 전용 유틸
├── assets/
├── app.config.ts
└── package.json
```

## web/desktop과의 차이

| 영역 | web/desktop | mobile |
|---|---|---|
| UI 컴포넌트 | `@flux/ui` 공유 | 자체 구현 (RN 컴포넌트) |
| 스타일 | Tailwind CSS v4 | NativeWind |
| 라우팅 | Next.js App Router | Expo Router |
| 에디터 렌더링 | DOM 기반 | 네이티브 뷰 기반 |
| store/api | **동일** (`@flux/store`, `@flux/api-client`) | **동일** |

## 핵심 규칙

- **오프라인 우선**: 모바일은 네트워크가 불안정하므로 로컬 캐시 → 동기화 패턴을 기본으로 한다.
- **editor-core 코어만 공유**: CRDT 연산 로직은 `@flux/editor-core`, 렌더링은 모바일 전용.
- **네이티브 모듈은 최소화**: Expo 관리형 워크플로우를 유지. 불가피한 경우만 config plugin.
- **`@/*`는 `src/`**를 가리킨다.

## 명령어

```bash
npx expo start            # 개발 서버
npx expo start --ios      # iOS 시뮬레이터
npx expo start --android  # Android 에뮬레이터
npx expo prebuild         # 네이티브 프로젝트 생성
```
