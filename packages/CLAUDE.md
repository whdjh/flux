# Flux Packages

앱 간 공유되는 코드를 패키지로 분리한 디렉토리.
각 패키지는 독립적으로 빌드 가능하고, 앱에서 `@flux/*`로 import한다.

## 패키지 목록

| 패키지 | 역할 | 사용처 |
|---|---|---|
| `@flux/shared` | 타입, 유틸, 상수 (도메인 무관) | 전체 |
| `@flux/ui` | 공통 UI 컴포넌트 (Button, Modal 등) | web, desktop |
| `@flux/store` | Zustand 스토어 (layout, collection, editor, sync) | 전 클라이언트 |
| `@flux/api-client` | API 클라이언트, 요청/응답 타입 | 전 클라이언트 |
| `@flux/editor-core` | loro CRDT 에디터 코어 (연산, 변환) | 전 클라이언트 |

## 의존 규칙

```
ui, store, api-client, editor-core  →  shared  →  외부만
```

- `shared`는 다른 `@flux/*` 패키지에 의존할 수 없다.
- 패키지 간 순환 의존 금지.
- 새 패키지가 필요하면 이 규칙을 먼저 확인.

## 패키지 내부 구조

```
packages/store/
├── src/
│   ├── layout.ts         # 레이아웃 스토어
│   ├── collection.ts     # 수집 스토어
│   ├── editor.ts         # 에디터 스토어
│   ├── sync.ts           # 동기화 스토어
│   └── index.ts          # barrel export
├── package.json
└── tsconfig.json
```

- 진입점은 `src/index.ts`.
- `package.json`의 `main`과 `types`는 `src/index.ts`를 가리킨다.
- 빌드 결과가 아닌 소스를 직접 참조 (내부 패키지이므로).

## 새 패키지 추가 절차

1. `packages/` 아래에 디렉토리 생성.
2. `package.json`에 `name: "@flux/패키지명"`, `private: true` 설정.
3. `src/index.ts` 생성 (barrel export).
4. 의존 규칙 위반 여부 확인.
5. 사용할 앱에서 `pnpm add @flux/패키지명 --workspace`.
