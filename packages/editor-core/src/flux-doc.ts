import {
  LoroDoc,
  LoroList,
  LoroText,
  UndoManager,
  VersionVector,
} from "loro-crdt";

/**
 * 텍스트 컨테이너 이름. loro는 이름 있는 루트 컨테이너를 쓴다.
 */
export const TEXT_CONTAINER = "text";

/**
 * 아이템 임베드 컨테이너 이름. LoroList에 `{ item_id, position }` 객체를 저장한다.
 */
export const EMBEDS_CONTAINER = "embeds";

/**
 * JSON 직렬화 형태. 테스트 비교용 평탄 구조다.
 */
export interface FluxDocJSON {
  text: string;
  embeds: Array<{ item_id: string; position: number }>;
}

/**
 * Undo 스택 기본 크기. 메모리 상한을 두기 위해 사용한다.
 */
export const DEFAULT_MAX_UNDO_STEPS = 100;

/**
 * 텍스트 스타일 설정. 한 번만 호출해도 문서 전체에 적용된다.
 */
const TEXT_STYLE_CONFIG = {
  bold: { expand: "after" as const },
  italic: { expand: "after" as const },
  underline: { expand: "after" as const },
  strike: { expand: "after" as const },
  code: { expand: "none" as const },
  link: { expand: "none" as const },
};

export interface FluxDocOptions {
  /**
   * Undo 스택의 최대 크기. 기본 100.
   */
  maxUndoSteps?: number;
  /**
   * Undo/Redo 병합 간격(ms). 기본 0 (병합하지 않음) — 테스트 결정성 보장용.
   */
  mergeInterval?: number;
}

/**
 * loro CRDT 문서 래퍼.
 *
 * 플랫폼 독립적인 코어 로직만 담는다. DOM, React, RN은 다루지 않는다.
 */
export class FluxDoc {
  readonly doc: LoroDoc;
  private readonly undoManager: UndoManager;

  private constructor(doc: LoroDoc, options: FluxDocOptions = {}) {
    this.doc = doc;
    this.doc.configTextStyle(TEXT_STYLE_CONFIG);
    this.undoManager = new UndoManager(this.doc, {
      maxUndoSteps: options.maxUndoSteps ?? DEFAULT_MAX_UNDO_STEPS,
      mergeInterval: options.mergeInterval ?? 0,
    });
  }

  /**
   * 빈 FluxDoc을 만든다.
   */
  static create(options: FluxDocOptions = {}): FluxDoc {
    const doc = new LoroDoc();
    return new FluxDoc(doc, options);
  }

  /**
   * 스냅샷 바이트에서 문서를 복원한다.
   */
  static load(bytes: Uint8Array, options: FluxDocOptions = {}): FluxDoc {
    const doc = LoroDoc.fromSnapshot(bytes);
    return new FluxDoc(doc, options);
  }

  /**
   * 전체 스냅샷을 바이트로 내보낸다. SQLite crdt_doc 저장용.
   */
  exportSnapshot(): Uint8Array {
    // 미커밋 변경이 있으면 먼저 커밋해야 스냅샷에 포함된다.
    this.doc.commit();
    return this.doc.export({ mode: "snapshot" });
  }

  /**
   * 주어진 버전 이후의 변경만 델타로 내보낸다.
   *
   * @param fromVersion — `undefined`면 전체 히스토리를 내보낸다.
   */
  exportDelta(fromVersion?: Uint8Array): Uint8Array {
    this.doc.commit();
    if (fromVersion === undefined) {
      return this.doc.export({ mode: "update" });
    }
    const vv = VersionVector.decode(fromVersion);
    return this.doc.export({ mode: "update", from: vv });
  }

  /**
   * 다른 FluxDoc의 델타를 현재 문서에 적용한다.
   */
  importDelta(delta: Uint8Array): void {
    this.doc.import(delta);
  }

  /**
   * 현재 문서의 버전 벡터를 바이트로 인코딩한다.
   */
  version(): Uint8Array {
    return this.doc.oplogVersion().encode();
  }

  /**
   * 내부 텍스트 컨테이너. 텍스트 연산 모듈이 사용한다.
   */
  getText(): LoroText {
    return this.doc.getText(TEXT_CONTAINER);
  }

  /**
   * 내부 임베드 리스트 컨테이너. 임베드 연산 모듈이 사용한다.
   */
  getEmbeds(): LoroList<{ item_id: string; position: number }> {
    return this.doc.getList(EMBEDS_CONTAINER) as LoroList<{
      item_id: string;
      position: number;
    }>;
  }

  /**
   * 내부 undo 매니저. 히스토리 모듈이 사용한다.
   */
  getUndoManager(): UndoManager {
    return this.undoManager;
  }

  /**
   * 평탄 JSON 구조. 테스트 비교와 스냅샷 비교용.
   */
  toJSON(): FluxDocJSON {
    this.doc.commit();
    const text = this.doc.getText(TEXT_CONTAINER).toString();
    const embedsList = this.doc.getList(EMBEDS_CONTAINER).toJSON();
    const embeds = (Array.isArray(embedsList) ? embedsList : []).map(
      (e: unknown): { item_id: string; position: number } => {
        const obj = (e ?? {}) as { item_id?: unknown; position?: unknown };
        return {
          item_id: typeof obj.item_id === "string" ? obj.item_id : "",
          position: typeof obj.position === "number" ? obj.position : 0,
        };
      }
    );
    return { text, embeds };
  }

  /**
   * 보류 중인 변경을 강제로 커밋한다. 테스트와 델타 내보내기 경계 제어용.
   */
  commit(): void {
    this.doc.commit();
  }

  /**
   * 피어 ID를 설정한다. 수렴 테스트에서 충돌 방지용.
   */
  setPeerId(peer: number | bigint | `${number}`): void {
    this.doc.setPeerId(peer);
  }
}
