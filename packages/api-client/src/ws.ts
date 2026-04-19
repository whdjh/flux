import { WsMessageSchema, type WsMessage } from "@flux/shared";

export interface ReconnectPolicy {
  /** 최대 재연결 시도. 기본 5 */
  maxAttempts: number;
  /** 지수 백오프 기본 지연(ms). 기본 500 */
  baseDelayMs: number;
  /** 백오프 상한(ms). 기본 10_000 */
  maxDelayMs: number;
}

export interface WsClientOptions {
  /** WebSocket URL (예: wss://api.example.com/sync) */
  url: string;
  /** 연결 시 쿼리 ?token=... 으로 주입할 토큰을 반환 */
  getToken?: () => string | null | undefined;
  /** 재연결 정책 */
  reconnect?: ReconnectPolicy;
  /** 테스트용 소켓 주입 */
  socketFactory?: (url: string) => WebSocket;
  /** 테스트용 sleep 주입 */
  sleep?: (ms: number) => Promise<void>;
}

export type WsListener = (msg: WsMessage) => void;
export type WsErrorListener = (err: unknown) => void;

const DEFAULT_RECONNECT: ReconnectPolicy = {
  maxAttempts: 5,
  baseDelayMs: 500,
  maxDelayMs: 10_000,
};

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

type OutgoingMessage = Record<string, unknown>;

export class WsClient {
  private options: WsClientOptions;
  private policy: ReconnectPolicy;
  private socketFactory: (url: string) => WebSocket;
  private sleepImpl: (ms: number) => Promise<void>;
  private socket: WebSocket | null = null;
  private queue: OutgoingMessage[] = [];
  private listeners = new Set<WsListener>();
  private errorListeners = new Set<WsErrorListener>();
  private attempts = 0;
  private closedByUser = false;

  constructor(options: WsClientOptions) {
    this.options = options;
    this.policy = options.reconnect ?? DEFAULT_RECONNECT;
    this.socketFactory =
      options.socketFactory ??
      ((url) => new WebSocket(url));
    this.sleepImpl = options.sleep ?? defaultSleep;
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  on(listener: WsListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onError(listener: WsErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  async connect(): Promise<void> {
    this.closedByUser = false;
    this.attempts = 0;
    await this.openSocket();
  }

  close(): void {
    this.closedByUser = true;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  send(message: OutgoingMessage): void {
    if (this.isConnected() && this.socket) {
      this.socket.send(JSON.stringify(message));
    } else {
      this.queue.push(message);
    }
  }

  private buildUrl(): string {
    const token = this.options.getToken?.();
    if (!token) return this.options.url;
    const separator = this.options.url.includes("?") ? "&" : "?";
    return `${this.options.url}${separator}token=${encodeURIComponent(token)}`;
  }

  private openSocket(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let socket: WebSocket;
      try {
        socket = this.socketFactory(this.buildUrl());
      } catch (err) {
        reject(err);
        return;
      }
      this.socket = socket;

      const handleOpen = () => {
        this.attempts = 0;
        this.flushQueue();
        resolve();
      };
      const handleClose = () => {
        this.socket = null;
        if (!this.closedByUser) {
          void this.scheduleReconnect();
        }
      };
      const handleError = (ev: Event) => {
        this.emitError(ev);
      };
      const handleMessage = (ev: MessageEvent) => {
        this.handleRawMessage(ev.data);
      };

      socket.onopen = handleOpen;
      socket.onclose = handleClose;
      socket.onerror = handleError;
      socket.onmessage = handleMessage;
    });
  }

  private flushQueue(): void {
    if (!this.socket || !this.isConnected()) return;
    while (this.queue.length > 0) {
      const msg = this.queue.shift()!;
      this.socket.send(JSON.stringify(msg));
    }
  }

  private handleRawMessage(raw: unknown): void {
    let parsed: unknown;
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (err) {
      this.emitError(err);
      return;
    }
    const result = WsMessageSchema.safeParse(parsed);
    if (!result.success) {
      this.emitError(result.error);
      return;
    }
    for (const listener of this.listeners) {
      try {
        listener(result.data);
      } catch (err) {
        this.emitError(err);
      }
    }
  }

  private emitError(err: unknown): void {
    for (const listener of this.errorListeners) {
      try {
        listener(err);
      } catch {
        // 리스너 자체의 에러는 무시
      }
    }
  }

  private async scheduleReconnect(): Promise<void> {
    if (this.closedByUser) return;
    if (this.attempts >= this.policy.maxAttempts) return;
    this.attempts++;
    const delay = Math.min(
      this.policy.baseDelayMs * Math.pow(2, this.attempts - 1),
      this.policy.maxDelayMs
    );
    await this.sleepImpl(delay);
    if (this.closedByUser) return;
    try {
      await this.openSocket();
    } catch (err) {
      this.emitError(err);
    }
  }
}
