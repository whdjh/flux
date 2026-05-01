# unit-0: register-hook 패턴 도입 (Phase 1, 순차)

## 작업 제목

apps/cli의 명령 파일들이 `register(program, openCli)` 함수를 export하도록 전환한다. index.ts는 register 호출만 한다. 기존 동작·CLI 인터페이스는 100% 동일.

## 맥락

- 프로젝트 루트: `/home/jjy84/04_april/flux` (이 워크트리에서는 `phase1/cli-register-hook` 브랜치)
- `apps/cli`는 정식 사용자 인터페이스가 아니라 **기능 검증용 개발 도구**다 (`docs/스택.md` "개발 도구: CLI 우선" 절). UI 없이 packages/* 위에서 핵심 루프를 검증한다.
- 직후 Phase 2에서 docs·search·sync 세 unit이 병렬로 새 명령 파일을 추가한다. 그 unit들이 `index.ts`를 건드리지 않게 하려면 지금 register 패턴을 도입해야 한다.

## 목표

각 `commands/<name>.ts`가 다음 시그니처의 `register` 함수를 export:

```ts
import type { Command } from "commander";
import type { CliContext } from "../db";

export function register(
  program: Command,
  openCli: () => Promise<CliContext>
): void {
  // 기존 program.command(...) 블록을 이 안으로 이동
}
```

`index.ts`는 다음 형태가 된다:

```ts
import { Command } from "commander";
import { openCli } from "./db";
import { register as registerCapture } from "./commands/capture";
import { register as registerList } from "./commands/list";
import { register as registerFolder } from "./commands/folder";

const program = new Command()
  .name("flux")
  .description("Flux CLI — UI 없이 핵심 루프 검증")
  .version("0.0.0");

registerCapture(program, openCli);
registerList(program, openCli);
registerFolder(program, openCli);

program.parseAsync(process.argv).catch(...);
```

## 수정

- `apps/cli/src/index.ts` — register 호출만 남기는 형태로 슬림화
- `apps/cli/src/commands/capture.ts` — 기존 순수 함수(`capture`, `formatCaptured`) 유지 + `register` 추가
- `apps/cli/src/commands/list.ts` — 동일 패턴
- `apps/cli/src/commands/folder.ts` — 동일 패턴 (서브커맨드 `create/ls/mv` 모두 register 안에서 등록)

## 생성

없음.

## 건드리지 않음 (readonly)

- `apps/cli/src/db.ts` — `openCli`, `CliContext` 정의가 이미 안정. 시그니처 그대로 사용
- `apps/cli/src/adapter.ts` — NodeSqliteAdapter
- `apps/cli/src/commands/folder.test.ts` — 테스트는 순수 함수만 호출하므로 영향 없음. 변경 금지로 회귀 검증
- `packages/**` 전체

## 패턴 참조

- 현재 `apps/cli/src/index.ts`의 `program.command(...)` 블록 구조를 그대로 register 안으로 이동
- `commander` 서브커맨드는 `program.command("folder").command("create")` 형태로 그대로 유지

## 확인 필요 (사용자 결정)

없음. register 함수 시그니처는 `(program, openCli)` 두 인자로 통일 — 명령 핸들러가 `openCli`를 호출해 컨텍스트를 만들고 finally에서 `adapter.close()` 패턴 그대로.

## 완료 조건

- [ ] `apps/cli/src/commands/{capture,list,folder}.ts`가 `register` 함수 export
- [ ] `apps/cli/src/index.ts`가 세 register 호출만 함 (직접 `program.command(...)` 호출 없음)
- [ ] `pnpm --filter @flux/cli test` — 9 tests 그대로 통과
- [ ] 스모크 테스트:
  ```sh
  rm -rf /tmp/flux-smoke
  FLUX_HOME=/tmp/flux-smoke pnpm --filter @flux/cli exec tsx src/index.ts --help
  FLUX_HOME=/tmp/flux-smoke pnpm --filter @flux/cli exec tsx src/index.ts capture "test"
  FLUX_HOME=/tmp/flux-smoke pnpm --filter @flux/cli exec tsx src/index.ts list
  FLUX_HOME=/tmp/flux-smoke pnpm --filter @flux/cli exec tsx src/index.ts folder create X
  FLUX_HOME=/tmp/flux-smoke pnpm --filter @flux/cli exec tsx src/index.ts folder ls
  ```
- [ ] 모노레포 전체 테스트 회귀 없음: `pnpm -r test`
- [ ] 커밋: `refactor(cli): commands에 register 패턴 도입 — Phase 2 병렬화 준비`
- [ ] 푸시 또는 워크트리 상태로 두고 dev 머지는 사람이 진행
