## UX Patterns (선택/드래그/리스트)

- 목적: 공통 상호작용 기준을 한 곳에 정리
- 소스: `WIREFRAME_PAGES_CHECKLIST.md`, `UX_STATES_OFFLINE_ERROR.md`

### 선택(Selection)
- 단일/멀티 선택 지원: Click = 단일, Shift = 구간, Ctrl/Cmd = 개별 토글
- 벌크 액션: 선택 시 상단/하단 바 노출(이동/태그/삭제)
- 키보드: Arrow로 포커스 이동, Space/Enter로 선택 토글

### DnD(Drag and Drop)
- 드래그 시작: 카드/행 핸들 혹은 전체 영역 허용
- 드랍 피드백: hover 강조, 유효/무효 영역 구분
- 실패 시 원복(revert) + 토스트
- 키보드 대체: 컨텍스트 메뉴의 이동으로 대체 가능

### 리스트/그리드/매이슨리
- Masonry: 열 계산 `floor((contentWidth + gutter) / (cardWidth + gutter))`
- 가상 스크롤 권장, 스켈레톤 제공
- 페이지네이션 vs 인피니트: 데이터 밀집도/연속성 기준으로 화면별 결정

### 검색/필터/정렬
- 입력 디바운스(200~300ms), 히스토리/추천 제공
- 정렬/필터 변경 즉시 반영, 스켈레톤 상태로 전환

### DoD(Patterns)
- 선택/벌크/DnD가 공통 룰로 일관 동작
- Masonry/그리드/리스트 전환 시 레이아웃 점프 최소화








