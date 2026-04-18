# BDD 명세: VS Code 탭 시스템 (Tab System)

VS Code의 탭 관리 시스템을 구현한다. 검증된 효율성(수백만 개발자가 매일 8시간 이상 사용)과 근육 기억(Ctrl+Tab, 드래그앤드롭)을 활용한다.

핵심 시나리오:
- 탭 생성: 파일 열기 시 파일 이름 + 아이콘 + 활성 상태. 긴 파일명은 잘림 + 툴팁.
- 상태 관리: 수정 시 (.) 표시(isDirty). 저장 시 표시 제거. 핀 고정 시 왼쪽 이동.
- 인터랙션: 클릭으로 전환, X 버튼/중앙클릭으로 닫기. 마지막 탭 닫으면 이전 탭 활성화.
- 드래그앤드롭: 같은 그룹 내 재정렬. 다른 그룹으로 이동. 가장자리 드래그로 새 그룹 생성.
- 컨텍스트 메뉴: Close, Close Others, Close to the Right, Close All, Pin/Unpin, Split Right/Down.
- 스크롤: 탭이 초과하면 수평 스크롤 + 스크롤 버튼. 활성 탭으로 자동 스크롤.
- 키보드: Ctrl+Tab(다음), Ctrl+Shift+Tab(이전).

```typescript
interface IEditorTab {
  id: string;
  name: string;
  title: string;
  resource: string;
  isDirty: boolean;
  isPinned: boolean;
  isPreview: boolean;
  icon: string;
}
```

구현 현황: 생성/표시/상태/클릭/닫기/기본 드래그앤드롭/애니메이션/아이콘 완료. 컨텍스트 메뉴/핀 고정/키보드 단축키/스크롤 관리 진행 중. 미리보기 모드/탭 그룹/분할 기능/접근성 미구현.
