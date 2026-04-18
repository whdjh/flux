## IA / Routes (초안)

- 목적: 최상위 내비, 라우트 규칙, 패널/모달 전환 기준을 한눈에 정의
- 소스: `WIREFRAME_PAGES_CHECKLIST.md`, `tokens-and-shell.json`

### 최상위 내비 & 라우트 맵
- `/inbox` → 01_Inbox
- `/projects` → 02_Project
  - `/projects/:folderId`
  - 사이드 패널 상세: `/projects/:folderId?detail=:itemId`
- `/detail/:itemId` → 03_Detail(모달 폴백)
- `/notes/:noteId` → 04_Editor
- `/search` → 05_Search
- `/ai` → 06_AI (M1)
- `/sticky` → 07_Sticky (M1)
- `/settings` → 08_Settings
- `/layout` → 09_Layout
- `/capture` → 10_Capture
- `/collab` → 11_Collab (M2)
- `/export` → 12_Export (M1)
- `/tags` → 13_Tags (M1)
- `/trash` → 14_Trash (M1)
- `/onboarding` → 15_Onboarding
- `/voice` → 16_Voice (M2)
- `/viewer` → 17_Viewer (M1)

### 내비게이션 모델
- 좌측 사이드바 섹션: Inbox / Projects / Tags / Views / Favorites
- 상단 탭: 최근 열린 뷰 탭화, 새 탭 생성/닫기/재정렬

### 상세(패널/모달) 전환 기준
- 기본: 우패널(슬라이드) ←→ 모달
- 브레이크포인트: 뷰포트 너비 ≥ 1280px → 우패널, 그 미만 → 모달
- 딥링크: 우패널은 쿼리 `?detail=:itemId`, 모달은 `/detail/:itemId`

### 상태 보존
- 탭/사이드바 선택, 정렬/필터, 보기모드(List/Grid/Masonry/Justified) URL 쿼리로 보존
- 예: `/inbox?view=masonry&sort=latest&filter=tag:design`

### 접근성
- 브레드크럼: Projects 트리 경로를 상단 보조 내비로 표시(접근성 라벨 포함)
- 키보드: 탭 순서와 포커스 트랩 준수(모달/패널)

### DoD(IA)
- 최상위 화면 모두 직접 라우트 가능 + 뒤로/앞으로 내비 정상 동작
- 패널↔모달 전환 기준에 따라 동일 컨텐츠로 딥링크 가능
- 정렬/필터/보기모드가 URL로 보존되고 공유 시 동일 상태 재현

### 확인 필요(답 주면 바로 반영)
- `/detail/:itemId` 모달 경로 유지 vs 전부 쿼리 기반(`?detail=`) 통합?
- 에디터 경로 `/notes/:noteId` 명명 확정?(`/notes`/`/memo` 선호안)
- 탭 고정 라우트(핀 탭) 후보: `/inbox`, `/projects`, `/search`, `/settings`만?





