# BDD 명세: 분할뷰 (Split View)

VS Code 스타일의 다중 패널 레이아웃이다. 시각적으로 분리된 정보는 30% 더 빠르게 비교 가능하고, 탭 전환 대비 분할 화면은 컨텍스트 전환 비용을 60% 감소시킨다.

핵심 시나리오:
- Split Right/Down 명령으로 수평/수직 분할. 초기 비율 50:50.
- 스플리터 드래그로 실시간 크기 조절. 최소 패널 크기 100px.
- 스플리터 더블클릭으로 50:50 리셋.
- 패널 닫기 시 인접 패널이 공간을 자동으로 채움.
- 패널 최대화/복원 토글.
- 파일 드래그로 특정 패널에서 열기.
- 탭을 다른 패널로 드래그하여 이동.
- 앱 종료 시 레이아웃/크기/파일 정보 저장, 시작 시 복원.
- 키보드: Ctrl+1,2,3으로 패널 포커스 이동. Ctrl+Alt+방향키로 인접 패널 이동.

```typescript
interface SplitViewLayout {
  orientation: 'horizontal' | 'vertical';
  children: (SplitViewLayout | EditorPanel)[];
  sizes: number[];
}

interface EditorPanel {
  id: string;
  type: 'editor';
  activeTab: string;
  tabs: string[];
}
```

구현 현황: 기본 분할/리사이즈/드래그앤드롭/포커스 관리/키보드 내비게이션 완료. 레이아웃 영속성/패널 최대화/고급 그리드 진행 중. 레이아웃 프리셋/패널 스왑/중첩 분할/애니메이션 미구현.
