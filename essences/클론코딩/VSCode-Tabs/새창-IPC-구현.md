# 새 창으로 탭 이동 IPC 구현

VSCode의 `maybeCreateAuxiliaryEditorPartAt` 기능을 Electron IPC로 구현한 내용

## 구현 개요

탭을 드래그하여 새 창으로 이동하는 기능을 완전히 구현했다. Alt 키를 누른 채로 탭을 드래그하면 새 BrowserWindow가 생성되고, 해당 탭의 에디터가 새 창에서 자동으로 열린다.

## 구현된 파일

### 1. IPC 계약 정의

**파일**: `src/shared/ipc/contracts.ts`

```typescript
// Editor window operations
export const IPC_EDITOR = {
  CREATE_AUXILIARY_WINDOW: 'editor:createAuxiliaryWindow',
  RECEIVE_EDITOR_DATA: 'editor:receiveEditorData',
} as const;

export interface EditorData {
  id: string;
  name: string;
  resource: string;  // File path or resource URI
  content?: string;
  viewType?: string;
  isDirty?: boolean;
  isPinned?: boolean;
  isSticky?: boolean;
}

export interface AuxiliaryWindowOptions {
  x: number;  // Window position X
  y: number;  // Window position Y
  width?: number;
  height?: number;
  editorData: EditorData;
}

export interface AuxiliaryWindowResult {
  success: boolean;
  windowId?: number;
  error?: string;
}
```

### 2. Main Process IPC Handler

**파일**: `src/backend/interfaces/ipc/registerEditorIPC.ts`

핵심 기능:
- 새 BrowserWindow 생성
- 화면 경계 체크 (창이 화면 밖으로 나가지 않도록)
- 에디터 데이터를 새 창으로 전송
- 창 닫기 시 자동 정리

```typescript
export function registerEditorIPC(): void {
  ipcMain.handle(
    IPC_EDITOR.CREATE_AUXILIARY_WINDOW,
    async (event, options: AuxiliaryWindowOptions): Promise<AuxiliaryWindowResult> => {
      // 새 창 생성
      const auxiliaryWindow = new BrowserWindow({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        frame: false,
        transparent: true,
        // ... 기타 설정
      });

      // 앱 로드
      await auxiliaryWindow.loadURL(/* ... */);

      // 에디터 데이터 전송
      auxiliaryWindow.webContents.send(
        IPC_EDITOR.RECEIVE_EDITOR_DATA,
        options.editorData
      );

      return { success: true, windowId };
    }
  );
}
```

### 3. Preload Script 업데이트

**파일**: `src/preload.ts`

renderer 프로세스에서 사용할 수 있는 API 노출:

```typescript
editor: {
  createAuxiliaryWindow: (options: AuxiliaryWindowOptions) =>
    ipcRenderer.invoke(IPC_EDITOR.CREATE_AUXILIARY_WINDOW, options),

  onReceiveEditorData: (callback: (data: EditorData) => void) => {
    const listener = (_: unknown, data: EditorData) => callback(data);
    ipcRenderer.on(IPC_EDITOR.RECEIVE_EDITOR_DATA, listener);
    return () => ipcRenderer.removeListener(IPC_EDITOR.RECEIVE_EDITOR_DATA, listener);
  },
}
```

### 4. TypeScript 타입 정의

**파일**: `src/shared/types/preload.d.ts`

Window 인터페이스에 editor API 추가:

```typescript
interface Window {
  electronAPI: {
    // ... 기타 API
    editor: {
      createAuxiliaryWindow: (options: AuxiliaryWindowOptions) => Promise<AuxiliaryWindowResult>;
      onReceiveEditorData: (callback: (data: EditorData) => void) => () => void;
    };
  };
}
```

### 5. maybeCreateAuxiliaryEditorPartAt 구현

**파일**: `src/demos/vscode-tabs-clone/components/EditorTabsControl.tsx`

VSCode의 `maybeCreateAuxiliaryEditorPartAt` 메서드를 완전히 구현:

```typescript
const maybeCreateAuxiliaryEditorPartAt = useCallback(
  async (e: React.DragEvent, element: HTMLElement): Promise<boolean> => {
    if (!draggedEditor) return false;

    // 마우스 위치에서 창 위치 계산
    const x = e.clientX;
    const y = e.clientY;

    // 에디터 데이터 생성
    const editorData = {
      id: draggedEditor.id,
      name: draggedEditor.name,
      resource: draggedEditor.resource,
      viewType: draggedEditor.viewType,
      isDirty: draggedEditor.isDirty,
      isPinned: draggedEditor.isPinned,
      isSticky: draggedEditor.isSticky,
    };

    // IPC 호출로 새 창 생성
    const result = await window.electronAPI.editor.createAuxiliaryWindow({
      x, y, width: 800, height: 600, editorData
    });

    if (result.success) {
      // 현재 창에서 에디터 제거
      closeEditor(draggedEditor.id);
      return true;
    }

    return false;
  },
  [draggedEditor, closeEditor]
);
```

### 6. 새 창에서 에디터 수신

**파일**: `src/demos/vscode-tabs-clone/hooks/useAuxiliaryWindowReceiver.ts`

새 창이 열리면 자동으로 에디터 데이터를 수신하여 탭을 연다:

```typescript
export function useAuxiliaryWindowReceiver() {
  const { openEditor } = useTabsStore();

  useEffect(() => {
    const unsubscribe = window.electronAPI.editor.onReceiveEditorData((data: EditorData) => {
      // 에디터 열기
      openEditor({
        id: data.id,
        name: data.name,
        resource: data.resource,
        viewType: data.viewType || 'text',
        isDirty: data.isDirty || false,
        isPinned: data.isPinned || false,
        isSticky: data.isSticky || false,
      });
    });

    return unsubscribe;
  }, [openEditor]);
}
```

**사용**: `EditorTabsControlDemo.tsx`에서 hook 호출

```typescript
export const EditorTabsControlDemo: React.FC = () => {
  useAuxiliaryWindowReceiver();  // 에디터 데이터 수신 대기
  // ...
}
```

### 7. EditorInput 타입 확장

**파일**: `src/demos/vscode-tabs-clone/types/editor.types.ts`

새 창 전송에 필요한 필드 추가:

```typescript
export interface EditorInput {
  id: string;
  name: string;
  description?: string;
  resource?: string;        // 추가
  typeId?: string;          // optional로 변경
  viewType?: string;        // 추가
  isDirty: boolean;
  isReadonly?: boolean;     // optional로 변경
  isPinned?: boolean;       // 추가
  isSticky?: boolean;       // 추가
  icon?: string;
  metadata?: Record<string, unknown>;
}
```

## 동작 흐름

1. **사용자 액션**
   - 사용자가 Alt 키를 누른 채로 탭 드래그
   - `isNewWindowOperation` 플래그가 true로 설정됨

2. **드래그 종료** (`handleTabDragEnd`)
   - 새 창 생성 조건 체크
   - `maybeCreateAuxiliaryEditorPartAt` 호출

3. **IPC 호출** (Renderer → Main)
   - `window.electronAPI.editor.createAuxiliaryWindow` 호출
   - 에디터 데이터와 창 위치 전송

4. **Main Process**
   - 새 BrowserWindow 생성
   - 화면 경계 체크로 위치 조정
   - 앱 로드 완료 대기

5. **에디터 데이터 전송** (Main → New Window)
   - `IPC_EDITOR.RECEIVE_EDITOR_DATA` 이벤트 발생
   - 새 창의 renderer가 수신

6. **새 창에서 에디터 열기**
   - `useAuxiliaryWindowReceiver` hook이 데이터 수신
   - `openEditor` 호출하여 탭 자동 생성

7. **원본 창 정리**
   - `closeEditor` 호출하여 원본 창의 탭 제거

## 구현 완료 상태

VSCode의 38개 `EditorTabsControl` 메서드 중:
- ✅ **37개 완전 구현** (97.4%)
- ✅ **`maybeCreateAuxiliaryEditorPartAt`** - Electron IPC로 완전 구현됨

이제 VSCode 탭 시스템의 클론 코딩이 거의 100% 완료되었다.

## 테스트 방법

1. 앱 실행
   ```bash
   npm start
   ```

2. VSCode Tabs Demo 접속
   - `/demos/vscode-tabs` 경로

3. 테스트 시나리오
   - 일반 탭 드래그: 탭 순서 변경
   - Alt + 드래그: 새 창에서 열기

4. 확인 사항
   - 새 창이 마우스 위치에 생성되는지
   - 탭이 새 창에 정상적으로 표시되는지
   - 원본 창에서 탭이 제거되는지
   - 에디터 상태(dirty, pinned, sticky)가 유지되는지

## 향후 개선 가능 사항

현재 미구현된 기능 (향후 필요시 구현):
- `mergeGroup`: 여러 그룹 병합 (multi-group 구조 필요)
- 그룹 간 탭 드래그 (현재는 단일 그룹만)
- 새 창 위치 저장 및 복원
- 여러 탭 동시에 새 창으로 이동
