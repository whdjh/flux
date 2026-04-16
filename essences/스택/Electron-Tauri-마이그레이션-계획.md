# Electron → Tauri 마이그레이션 계획

영감 수집 툴의 단계적 마이그레이션 전략. 성능과 안정성을 위해 나중에 Tauri로 전환할 수 있는 구조로 개발한다.

---

## 왜 믿을 수 있나

프론트엔드는 Electron이나 Tauri나 동일한 코드를 쓴다.

### 동일한 부분 (80-90%)

**프론트엔드**:
- React 컴포넌트
- TailwindCSS 스타일
- React Router 라우팅
- Shadcn UI 컴포넌트
- Masonic 가상화 레이아웃

**클라우드 백엔드**:
- Supabase (DB, Auth, Realtime, Storage)
- OpenRouter (AI 요약)
- Elasticsearch (검색)

이 부분은 Electron → Tauri 마이그레이션해도 코드 변경이 거의 없다.

### 바뀌는 부분 (10-20%)

**로컬 파일 처리**:
- 파일 읽기/쓰기: Node.js fs → Rust std::fs
- 파일 감시: chokidar → notify
- 이미지 처리: Sharp → image-rs
- SQLite: better-sqlite3 → sqlx
- IPC 통신: Electron IPC → Tauri Command

이 부분만 재작성하면 된다.

---

## 3단계 전략

### Phase 1: Electron MVP (0-3개월)

빠르게 시장 진입. 협업 기능 검증.

**목표**:
- 핵심 기능 구현 (수집, 정리, 검색, 협업)
- 사용자 피드백 수집
- 시장 검증

**기술 스택**:
- Electron + React + Supabase
- Node.js로 로컬 파일 처리
- 웹 버전 동시 제공 (협업 진입 장벽 낮춤)

**성공 지표**:
- 사용자 100명 확보
- 협업 기능 활성화율 측정
- 성능 불만 수집

### Phase 2: 성능 평가 (3-6개월)

데이터 기반 의사결정.

**측정 항목**:
- 대량 파일 처리 시 사용자 불만
- 검색 속도 만족도
- 백그라운드 작업 중 UI 끊김 피드백
- 메모리 사용량 관련 문의
- 재시작 빈도

**Tauri 마이그레이션 기준**:

다음 조건 중 2개 이상 만족 시:
- 성능 불만 >30% 사용자
- 대량 파일 처리 요구 증가
- 장시간 실행 시 문제 보고 빈번
- 웹 버전 사용률 <20% (데스크톱 중심)

조건 불만족 시:
- Electron 유지
- 프론트엔드 최적화에 집중

### Phase 3: Tauri 마이그레이션 (6-9개월)

성능 개선 버전 출시.

**전략**:
- 웹 버전: Electron 코드베이스 유지 (협업 진입점)
- 데스크톱: Tauri로 전환 (프리미엄 성능)

**하이브리드 구조**:
```
/frontend           # React (Electron/Tauri/웹 공유)
/electron-backend   # Node.js (웹 버전용)
/tauri-backend      # Rust (데스크톱 프리미엄)
```

---

## 마이그레이션 작업량

### 재사용 가능 (변경 없음)

**프론트엔드 컴포넌트 (~80%)**:
- src/features/* (모든 Feature 모듈)
- src/components/* (공용 컴포넌트)
- src/routes/* (페이지)
- src/lib/* (유틸리티 - 파일 접근 제외)

**클라우드 연동 (100%)**:
- Supabase 클라이언트 코드
- OpenRouter API 호출
- Elasticsearch 쿼리

### 재작성 필요 (~10-20%)

**로컬 파일 백엔드**:
- 파일 시스템 작업: 2-3주
- 이미지 처리: 1-2주
- SQLite 연동: 1주
- 파일 감시: 1주
- 크롬 확장 연동: 1-2주

**IPC 레이어**:
- Electron IPC → Tauri Command: 1-2주
- 프론트엔드 어댑터: 1주

**총 예상 작업량**: 8-12주 (Rust 경험에 따라 가변)

---

## 마이그레이션 로드맵

### 1단계: 인프라 준비 (1주)

**Tauri 프로젝트 초기화**:
```bash
cd tauri-boilerplate
npm create tauri-app
```

**기존 프론트엔드 복사**:
```bash
cp -r electron-boilerplate/src/features tauri-boilerplate/src/
cp -r electron-boilerplate/src/components tauri-boilerplate/src/
cp -r electron-boilerplate/src/routes tauri-boilerplate/src/
```

### 2단계: 파일 시스템 백엔드 (2-3주)

**Rust 구현**:
- 파일 읽기/쓰기/삭제
- 폴더 트리 구조
- 메타데이터 추출
- 파일 감시

**예시**:
```rust
#[tauri::command]
async fn read_file(path: String) -> Result<Vec<u8>, String> {
    std::fs::read(&path)
        .map_err(|e| e.to_string())
}
```

### 3단계: 이미지 처리 (1-2주)

**image-rs 통합**:
- 썸네일 생성 (병렬)
- 메타데이터 추출
- 해시 계산

### 4단계: 검색 엔진 (1주)

**tantivy 통합**:
- 인덱스 생성
- 검색 쿼리
- 유의어 검색

### 5단계: 크롬 확장 연동 (1-2주)

**Rust HTTP 서버**:
- actix-web 설정
- /collect 엔드포인트
- Tauri 이벤트 전달

### 6단계: 프론트엔드 어댑터 (1주)

**환경 감지 레이어**:
```typescript
// lib/backend-adapter.ts
const isTauri = window.__TAURI__ !== undefined;

export const backend = {
  async readFile(path: string) {
    if (isTauri) {
      return invoke('read_file', { path });
    } else {
      return electronAPI.readFile(path);
    }
  }
};
```

### 7단계: 테스트 & 최적화 (2주)

- 기능 테스트
- 성능 벤치마크
- 메모리 프로파일링
- 사용자 베타 테스트

---

## 리스크와 대응

### 리스크 1: Rust 학습 곡선

**영향**: 개발 속도 50% 감소

**대응**:
- Rust 튜토리얼 1-2주 선행 학습
- Tauri 공식 예제 참고
- ChatGPT/Claude로 코드 생성 활용
- 복잡한 로직은 외부 crate 활용

### 리스크 2: 예상치 못한 버그

**영향**: 일정 지연 1-2주

**대응**:
- 충분한 버퍼 확보 (20% 여유)
- 단계별 테스트 철저히
- Electron 버전 병행 유지 (롤백 가능)

### 리스크 3: 생태계 제약

**영향**: 일부 npm 패키지 대체 필요

**대응**:
- 사전에 Rust crate 조사
- 대체 불가능한 기능은 Node.js 서버로 분리
- Tauri Plugin 생태계 활용

### 리스크 4: 사용자 혼란

**영향**: 기존 사용자 이탈

**대응**:
- 두 버전 병행 제공 (선택 가능)
- 마이그레이션 가이드 제공
- 성능 개선 이점 명확히 전달

---

## 의사결정 체크리스트

Phase 2 종료 시 다음 질문에 답한다:

**성능 관련**:
- [ ] 사용자 중 30% 이상이 성능 불만 제기?
- [ ] 대량 파일 처리 요구가 증가하는가?
- [ ] 검색 속도 개선 요청이 많은가?
- [ ] 백그라운드 작업 중 UI 끊김 피드백 있는가?

**사용 패턴**:
- [ ] 웹 버전 사용률이 20% 미만인가?
- [ ] 데스크톱 앱 사용 시간이 하루 평균 2시간 이상인가?
- [ ] 포스트잇 모드 사용률이 높은가?

**리소스**:
- [ ] Rust 개발자 확보 또는 학습 시간 확보 가능한가?
- [ ] 2-3개월 개발 기간 투입 가능한가?
- [ ] 병행 유지 관리 리소스 있는가?

**Yes가 5개 이상** → Tauri 마이그레이션 진행
**Yes가 3-4개** → 부분 최적화 고려
**Yes가 2개 이하** → Electron 유지, 프론트엔드 최적화

---

## 요약

Electron으로 시작해서 나중에 Tauri로 가는 건 충분히 가능하다. 프론트엔드 코드 80-90%는 그대로 쓰고, 로컬 파일 처리 부분만 재작성하면 된다.

핵심은 데이터 기반 의사결정이다. 사용자 피드백과 사용 패턴을 보고 판단한다. 성능이 핵심 불만이면 마이그레이션하고, 아니면 Electron으로 충분하다.

마이그레이션 작업량은 8-12주 정도다. 리스크는 있지만 관리 가능하다. 두 버전을 병행 제공하면 사용자 이탈 없이 전환할 수 있다.

**지금 할 일**: Electron으로 빠르게 MVP 만들고, 시장에서 배우며 결정한다.
