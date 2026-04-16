# IPC

Electron의 Main과 Renderer 프로세스는 서로 격리되어 있다. IPC(Inter-Process Communication)로 통신한다.

## 기본 구조

통신은 Preload 스크립트를 거친다. Renderer → Preload → Main 순서로 요청이 전달되고, 응답은 역순으로 돌아온다.

```
Renderer → Preload → Main → Preload → Renderer
```

## IPC 통신 흐름

IPC 통신은 3단계로 이루어진다.

### 1. Renderer에서 요청

Renderer는 window.electron API를 통해 요청한다. 파일을 읽고 싶으면 readFile을 호출한다.

```tsx
// src/app/views/Explorer.tsx
const handleFileClick = async (path: string) => {
  const content = await window.electron.readFile(path);
  setContent(content);
};
```

### 2. Preload에서 브릿지

Preload는 contextBridge로 안전한 API를 노출한다. ipcRenderer.invoke로 Main에 요청을 전달한다.

```ts
// src/preload/index.ts
contextBridge.exposeInMainWorld('electron', {
  readFile: (path: string) => ipcRenderer.invoke('read-file', path)
});
```

### 3. Main에서 처리

Main은 ipcMain.handle로 요청을 받는다. 경로를 검증하고 파일을 읽어서 결과를 반환한다.

```ts
// src/main/ipc/file-handlers.ts
ipcMain.handle('read-file', async (event, path: string) => {
  // Path Validation (Layer 5 보안)
  const validated = validatePath(path);

  // 파일 읽기
  const content = await fs.readFile(validated, 'utf-8');
  return content;
});
```

## IPC 채널 목록

프로젝트에서 사용하는 IPC 채널은 세 가지 카테고리로 나뉜다.

### 파일 시스템
- `read-file` - 파일 읽기
- `write-file` - 파일 쓰기
- `list-directory` - 디렉토리 목록
- `create-file` - 파일 생성
- `delete-file` - 파일 삭제

### 윈도우 관리
- `minimize-window` - 최소화
- `maximize-window` - 최대화
- `close-window` - 닫기
- `fullscreen-toggle` - 전체화면 토글

### 애플리케이션
- `get-app-version` - 앱 버전
- `get-user-data-path` - 사용자 데이터 경로
- `open-external` - 외부 링크 열기

## 보안 패턴

IPC는 두 가지 보안 장치를 사용한다.

### 입력 검증 (Zod)

모든 입력은 Zod 스키마로 검증한다. 타입과 길이를 확인해서 잘못된 데이터를 거른다.

```ts
// Layer 3: Zod 검증
const FilePathSchema = z.string().min(1).max(1024);

ipcMain.handle('read-file', async (event, path: unknown) => {
  const validatedPath = FilePathSchema.parse(path);
  // ...
});
```

### Path Traversal 방지

경로는 정규화하고 허용된 디렉토리 안에 있는지 확인한다. ../../ 같은 공격을 막는다.

```ts
// Layer 5: Path Validation
function validatePath(inputPath: string): string {
  const normalized = path.normalize(inputPath);
  const resolved = path.resolve(normalized);

  // 허용된 디렉토리 체크
  if (!resolved.startsWith(allowedBasePath)) {
    throw new Error('Path traversal detected');
  }

  return resolved;
}
```

## 에러 처리

에러는 객체로 감싸서 전달한다. Renderer에서 success를 확인해서 처리한다.

### Main에서

Main은 try-catch로 에러를 잡는다. 성공하면 success: true와 데이터를 반환하고, 실패하면 success: false와 에러 메시지를 반환한다.

```ts
ipcMain.handle('read-file', async (event, path: string) => {
  try {
    return { success: true, data: content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

### Renderer에서

Renderer는 result.success를 확인한다. 성공이면 데이터를 사용하고, 실패면 토스트로 에러를 표시한다.

```tsx
const result = await window.electron.readFile(path);
if (result.success) {
  setContent(result.data);
} else {
  toast.error(result.error);
}
```

## 이벤트 기반 통신

IPC는 양방향 통신도 지원한다. Main에서 Renderer로 이벤트를 보낼 수 있다.

### Main → Renderer

Main은 webContents.send로 이벤트를 전송한다. Renderer는 콜백으로 이벤트를 받는다.

```ts
// Main에서 이벤트 전송
webContents.send('file-changed', { path, content });

// Renderer에서 수신
window.electron.onFileChanged((data) => {
  console.log('File changed:', data);
});
```

## TypeScript 타입 안전성

Preload에서 타입을 정의하면 Renderer에서 자동완성이 된다. window.electron의 API 시그니처를 명시한다.

```ts
// src/preload/index.d.ts
interface ElectronAPI {
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
```

---

## 관련 문서

- [← 문서 네비게이션](../00-시작/00-시작하기.md)
- [아키텍처 개요](./05-아키텍처.md) - 전체 시스템 구조
- [보안](./07-보안.md) - IPC 보안 패턴
- [개발 워크플로우](../01-워크플로우/개발-워크플로우.md) - IPC 구현 방법