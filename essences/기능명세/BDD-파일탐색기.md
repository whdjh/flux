# BDD 명세: 파일 탐색기 (File Explorer)

VS Code 스타일의 파일 시스템 탐색기다. 파일 트리는 1983년 Apple Lisa부터 시작된 검증된 패턴이다. 트리 구조는 공간 기억을 활용해 50% 빠른 파일 찾기를 가능하게 한다(Miller, 1956).

핵심 시나리오:
- 트리 표시: 루트 폴더 내용을 트리로 표시. 확장자별 아이콘. .gitignore 필터링.
- 폴더 열기/닫기: 화살표 클릭으로 토글. 펼침 상태 세션 동안 유지. 레벨당 20px 들여쓰기.
- 가상 스크롤: 1000개 이상 파일에서도 뷰포트만 DOM 렌더링. 60fps 유지.
- 파일 작업: 인라인 입력으로 새 파일/폴더 생성. F2로 이름 변경(확장자 제외 선택). Delete로 삭제(확인 대화상자 + 휴지통 이동).
- 드래그앤드롭: 파일을 폴더로 드래그 이동. Ctrl/Cmd 누른 채 드래그로 복사. 유효하지 않은 위치에서 드롭 불가.
- 컨텍스트 메뉴: Open, Open to the Side, Rename, Delete, Cut, Copy, Paste.
- 검색: Ctrl+P로 Quick Open. 실시간 필터링 + 퍼지 매칭.
- Git 상태: 수정(주황), 새 파일(초록), 삭제(빨강), 무시(회색).
- 키보드: 위/아래 이동, 좌/우 폴더 접기/펼치기, Space 미리보기. 타입 어헤드 검색(1초 후 리셋).

```typescript
interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  size?: number;
  modified?: Date;
  gitStatus?: 'modified' | 'added' | 'deleted' | 'ignored';
  icon?: string;
}
```

성능 요구사항: 10,000개 파일 로드 1초 미만. 스크롤 프레임 드롭 5% 미만. 메모리 100MB 미만.

구현 현황: 트리/아이콘/펼침/접힘/가상 스크롤/기본 드래그앤드롭/컨텍스트 메뉴/파일 생성/삭제/Git 상태 완료. 고급 검색/키보드 내비게이션/인라인 이름 변경/멀티선택 진행 중. Cut/Copy/Paste/Undo/Redo/파일 미리보기/Breadcrumb 미구현.
