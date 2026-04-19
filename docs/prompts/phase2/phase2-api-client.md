# Phase 2 · packages/api-client 세션 프롬프트

너는 flux 모노레포의 `@flux/api-client` 패키지를 구현한다. 이 세션은 **이 패키지만** 건드린다.

## 맥락 로드

순서대로 읽는다.

1. `CLAUDE.md` — 프로젝트 절대 규칙
2. `docs/아키텍처.md` — 동기화 · API 설계 섹션
3. `docs/인프라.md` — 클라이언트 환경변수
4. `packages/shared/src/*.ts` — 엔티티·프로토콜·에러 (Phase 1 산출물, 이미 완성)

## 목표

flux-be 서버와 통신하는 클라이언트 라이브러리. REST는 초기 로드·벌크 작업, WebSocket은 실시간 동기화.

## 범위

**포함:**
- `RestClient` — HTTP 요청 래퍼 (fetch 기반). 인증 헤더 자동 주입. 응답을 Zod 스키마로 검증 후 타입 안전하게 반환. 에러는 `AppError` 계층으로 변환.
- `WsClient` — `/sync` WebSocket 클라이언트. 지수 백오프 재연결. 메시지 송신 큐(오프라인 대기). 수신 메시지 파싱 (`WsMessageSchema`) 후 이벤트 emit.
- REST 엔드포인트 래퍼: `items.list()`, `items.get(id)`, `items.create(dto)`, `items.delete(id)`, `documents.*`, `folders.*`, `auth.register/login/me`
- 재시도 정책: 5xx는 지수 백오프 재시도, 4xx는 즉시 실패

**제외:**
- 실제 서버 로직 (flux-be 몫)
- 로컬 캐싱 (`packages/store`의 책임)
- UI (apps 몫)
- 플랫폼별 fetch polyfill — 호스트 환경 fetch 사용

## 절대 규칙

- **`packages/shared/`는 절대 수정하지 않는다.** Phase 1에서 잠긴 공유 기반이다. 필요한 타입이 없다고 느껴지면 구현을 바꾸거나 내부 타입으로 처리한다.
- **다른 패키지(store·editor-core·ui) 파일을 수정하지 않는다.** Phase 2 병렬 원칙.
- **apps/ 파일을 수정하지 않는다.** 사용자가 이 패키지를 import해서 쓴다.
- 외부 API 키·시크릿 하드코딩 금지. 모든 URL·토큰은 클라이언트 옵션으로 주입받는다.

## TDD

1. 테스트 먼저 (RED) — vitest, msw(mock server worker) 활용
2. 최소 구현으로 통과 (GREEN)
3. 리팩터링 (REFACTOR)
4. 커버리지 80% 이상 유지

`packages/shared`의 vitest 설정·테스트 스타일(`*.test.ts` 인접 배치)을 그대로 따른다.

## 의존성

```bash
pnpm add -F @flux/api-client @flux/shared zod
pnpm add -F @flux/api-client -D vitest msw
```

## 산출물

```
packages/api-client/
├── package.json        (의존: @flux/shared, zod; dev: vitest, msw)
├── tsconfig.json
├── vitest.config.ts
└── src/
    ├── index.ts        (재수출)
    ├── rest.ts + rest.test.ts
    ├── ws.ts + ws.test.ts
    ├── items.ts + items.test.ts
    ├── documents.ts + documents.test.ts
    ├── folders.ts + folders.test.ts
    ├── auth.ts + auth.test.ts
    └── client.ts + client.test.ts  (RestClient + WsClient를 묶은 FluxClient)
```

## 완료 조건

- `pnpm -F @flux/api-client test` 모두 통과
- `pnpm -F @flux/api-client exec tsc --noEmit` 에러 0
- 모든 공개 API가 `@flux/shared`의 Zod 스키마로 검증
- 재연결 시나리오 테스트 존재 (WsClient)
- 커밋 메시지는 `.gitmessage.txt` 형식, `feat(api-client): Phase 2 api-client 구현` 류

## 마무리

완료 후 `docs/개발현황.md`의 Phase 2 표에서 api-client 항목을 ✅로 갱신한다.
