## 앱 레이아웃 퀵 스펙 (팀 공유용)

- 한 문장 요약: 캔버스 1680×1050, 좌측 사이드바 336px, 아이콘 24px, 기본 라운드 r12(대형 표면 r20), Masonry 카드 폭 162px.
- 목적: 모두가 같은 수치/규칙으로 화면을 만들어 일관성과 속도를 확보.
- 소스: 수치 대부분은 `design-system/tokens-and-shell.json`(토큰)에서 온다.

### 1) 캔버스 & 브레이크포인트
- 기본 캔버스: 1680×1050 px
- 추가 변형: 1440×900, 1280×800
- 그리드: 12 컬럼, 거터 24, 좌우 마진 24

### 2) Shell(앱 뼈대)
- Topbar 높이: 56
- Tabs 높이: 34
- Sidebar 폭: 336 (리사이즈 필요 시 ±24 단위 권장)
- Splitter 거터: 8, 프리셋: 1/2, 1/3, 1/4

### 3) 콘텐츠 영역 규격
- 리스트 행 높이: 52
- 카드(Card): 폭 162, 높이 200, 라운드 r12, 카드 간격(gutter) 24
- 보기 모드: List / Grid / Masonry / Justified

#### Masonry 컬럼 가이드(카드 162, gutter 24, 사이드바 336 기준)
- 1280 캔버스 → 콘텐츠 폭 ≈ 944 → 5열
- 1440 캔버스 → 콘텐츠 폭 ≈ 1104 → 6열
- 1680 캔버스 → 콘텐츠 폭 ≈ 1344 → 7열
(계산식: floor((콘텐츠폭 + gutter) / (카드폭 + gutter)))

### 4) 아이콘/라운드/포커스/그림자/밀도
- 아이콘: 24(기본), 보조 20/16, 스트로크 2px
- 라운드 맵핑: 입력/버튼/카드 r12, 패널/모달 r20, 칩 r8
- 포커스 링: 색 #5D3587, 두께 2, 오프셋 2, 코너 6
- 그림자: shadow-1 = 0 1px 2px rgba(0,0,0,.08), shadow-2 = 0 4px 8px rgba(0,0,0,.12)
- 밀도: compact 0.9 / comfortable 1.0 / spacious 1.1 (간격 배수)

### 5) 색/모드(요약)
- 브랜드: primary(400/500/600), optional accent(400)
- 모드: Light / Dark / (선택) High-contrast
- 의미색: success / warning / danger / info

### 6) 작업 규칙
- 여백/갭은 8pt 스케일만 사용(4/8/12/16/24/32/40/48/64)
- 임의 색상/px 직접 입력 금지 → 토큰만 사용
- 새 컴포넌트는 상태 변형 포함: hover / focus / active / disabled / selected / drag-over

### 7) 수용 기준(Checklist)
- 사이드바 336, 아이콘 24, 라운드 r12/r20 적용 확인
- Masonry 컬럼 수: 1280=5, 1440=6, 1680=7
- 8pt 스케일 유지, 대비: 본문 4.5:1 / UI 3:1 충족
- 다크 모드, reduce motion 적용 시 레이아웃/대비 무너짐 없음

### 8) 참고/싱크
- 토큰 파일: `design-system/tokens-and-shell.json`
- 템플릿(주석 포함): `design-system/tokens-and-shell.template.jsonc`
- 검증: 
  - 규칙 → `node design-system/validate_tokens.js`
  - 구조 → `node design-system/check_template_parity.js`

