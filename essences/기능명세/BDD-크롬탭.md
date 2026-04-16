# BDD 명세: 크롬 탭 애니메이션 (Chrome Tab Animation)

Chrome 브라우저의 부드러운 탭 애니메이션을 구현한다. VS Code 탭 시스템과 통합되어 기능성과 미려한 UX를 동시에 제공한다.

200ms 황금률: 인지 과학적으로 최적화된 타이밍이다. 100ms 이하는 즉각적이지만 연속성이 부족하고, 200-300ms는 부드럽고 자연스러우며, 400ms 이상은 느리고 답답하다.

핵심 시나리오:
- 탭 열기: 0에서 목표 너비로 200ms ease-out 확장. 다른 탭들 부드럽게 밀려남.
- 탭 닫기: 현재에서 0으로 200ms 축소. 투명도 1→0 페이드 아웃.
- 호버: 배경 밝아짐 150ms, 닫기 버튼 페이드 인.
- 재정렬 드래그: elevation 효과, 다른 탭 실시간 이동 300ms.
- 스냅백: 유효하지 않은 위치에서 드롭 시 250ms spring 애니메이션.
- 활성 상태 전환: 배경색 전환, 높이 +2px, 그림자 추가, 200ms.
- 그룹 생성: 선택 탭들 중앙 집합 → 컨테이너 페이드 인 → 색상 바 슬라이드, 총 400ms.

```typescript
const ANIMATION_CONFIG = {
  tabOpen: { duration: 200, easing: 'cubic-bezier(0.25, 0.1, 0.25, 1.0)' },
  tabClose: { duration: 200, easing: 'cubic-bezier(0.4, 0.0, 1, 1)' },
  tabReorder: { duration: 300, easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)' },
  hover: { duration: 150, easing: 'ease-in-out' }
};
```

성능 최적화: transform과 opacity만 애니메이션. will-change로 GPU 가속. 60fps 유지. 20개 이상 탭에서는 보이지 않는 탭 애니메이션 스킵.

구현 현황: 기본 열기/닫기/호버/재정렬/GPU 가속 완료. 그룹 애니메이션/로딩 인디케이터/spring 물리 진행 중. 파비콘 애니메이션/고급 그룹 전환/성능 스로틀링 미구현.
