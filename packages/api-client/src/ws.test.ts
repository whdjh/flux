import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WsClient, type WsClientOptions } from "./ws";

// 가짜 WebSocket 구현. send·close·이벤트 emit을 제어한다.
class FakeSocket {
  static OPEN = 1;
  static CLOSED = 3;
  readyState = FakeSocket.OPEN;
  sent: Array<string | ArrayBufferLike | Blob | ArrayBufferView> = [];
  onopen: ((ev: Event) => void) | null = null;
  onclose: ((ev: CloseEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;

  constructor(public url: string) {
    FakeSocket.instances.push(this);
  }

  static instances: FakeSocket[] = [];

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.readyState !== FakeSocket.OPEN) throw new Error("not open");
    this.sent.push(data);
  }

  close(): void {
    this.readyState = FakeSocket.CLOSED;
    this.onclose?.(new CloseEvent("close"));
  }

  // 테스트 헬퍼
  open(): void {
    this.readyState = FakeSocket.OPEN;
    this.onopen?.(new Event("open"));
  }

  fail(): void {
    this.readyState = FakeSocket.CLOSED;
    this.onerror?.(new Event("error"));
    this.onclose?.(new CloseEvent("close"));
  }

  recv(raw: string): void {
    this.onmessage?.(new MessageEvent("message", { data: raw }));
  }
}

describe("WsClient", () => {
  beforeEach(() => {
    FakeSocket.instances = [];
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const makeClient = (overrides: Partial<WsClientOptions> = {}): WsClient => {
    return new WsClient({
      url: "wss://example.com/sync",
      socketFactory: (url) => new FakeSocket(url) as unknown as WebSocket,
      sleep: () => Promise.resolve(),
      ...overrides,
    });
  };

  describe("연결", () => {
    it("connect는 open 이벤트까지 대기한다", async () => {
      const client = makeClient();
      const promise = client.connect();
      // 첫 소켓 open 이벤트 시뮬레이션
      FakeSocket.instances[0].open();
      await promise;
      expect(client.isConnected()).toBe(true);
    });

    it("토큰이 있으면 URL에 쿼리로 붙인다", async () => {
      const client = makeClient({ getToken: () => "tok_abc" });
      const promise = client.connect();
      FakeSocket.instances[0].open();
      await promise;
      expect(FakeSocket.instances[0].url).toContain("token=tok_abc");
    });

    it("토큰이 null이면 쿼리가 없다", async () => {
      const client = makeClient({ getToken: () => null });
      const promise = client.connect();
      FakeSocket.instances[0].open();
      await promise;
      expect(FakeSocket.instances[0].url).not.toContain("token=");
    });

    it("close 호출 시 isConnected는 false", async () => {
      const client = makeClient();
      const p = client.connect();
      FakeSocket.instances[0].open();
      await p;
      client.close();
      expect(client.isConnected()).toBe(false);
    });
  });

  describe("수신 메시지 파싱", () => {
    it("유효한 item_created 메시지를 파싱해서 on 이벤트로 전달한다", async () => {
      const client = makeClient();
      const listener = vi.fn();
      client.on(listener);

      const p = client.connect();
      FakeSocket.instances[0].open();
      await p;

      const msg = {
        type: "item_created",
        item: {
          id: "itm_1",
          user_id: "usr_1",
          type: "text",
          content: "hi",
          created_at: "2026-04-19T00:00:00.000Z",
          sync_file: false,
        },
      };
      FakeSocket.instances[0].recv(JSON.stringify(msg));

      expect(listener).toHaveBeenCalledTimes(1);
      const received = listener.mock.calls[0][0];
      expect(received.type).toBe("item_created");
      expect(received.item.id).toBe("itm_1");
    });

    it("item_deleted 메시지를 전달한다", async () => {
      const client = makeClient();
      const listener = vi.fn();
      client.on(listener);
      const p = client.connect();
      FakeSocket.instances[0].open();
      await p;

      FakeSocket.instances[0].recv(
        JSON.stringify({ type: "item_deleted", item_id: "itm_1" })
      );

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ type: "item_deleted", item_id: "itm_1" })
      );
    });

    it("스키마와 다른 메시지는 onError로 보낸다", async () => {
      const client = makeClient();
      const listener = vi.fn();
      const onError = vi.fn();
      client.on(listener);
      client.onError(onError);
      const p = client.connect();
      FakeSocket.instances[0].open();
      await p;

      FakeSocket.instances[0].recv(JSON.stringify({ type: "unknown_type" }));
      expect(listener).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it("JSON 파싱 실패 시 onError로 보낸다", async () => {
      const client = makeClient();
      const onError = vi.fn();
      client.onError(onError);
      const p = client.connect();
      FakeSocket.instances[0].open();
      await p;

      FakeSocket.instances[0].recv("not-json{");
      expect(onError).toHaveBeenCalled();
    });
  });

  describe("송신 큐", () => {
    it("연결되지 않은 상태에서 send하면 큐에 쌓인다", async () => {
      const client = makeClient();
      client.send({ type: "item_deleted", item_id: "itm_1" });
      // 아직 소켓 없음
      expect(FakeSocket.instances.length).toBe(0);

      const p = client.connect();
      FakeSocket.instances[0].open();
      await p;

      expect(FakeSocket.instances[0].sent).toHaveLength(1);
      const parsed = JSON.parse(FakeSocket.instances[0].sent[0] as string);
      expect(parsed).toEqual({ type: "item_deleted", item_id: "itm_1" });
    });

    it("연결된 상태에서는 즉시 전송한다", async () => {
      const client = makeClient();
      const p = client.connect();
      FakeSocket.instances[0].open();
      await p;

      client.send({ type: "item_deleted", item_id: "itm_2" });
      expect(FakeSocket.instances[0].sent).toHaveLength(1);
    });
  });

  describe("재연결 (지수 백오프)", () => {
    it("예기치 않게 끊기면 자동 재연결을 시도한다", async () => {
      const sleep = vi.fn((_ms: number) => Promise.resolve());
      const client = makeClient({
        sleep,
        reconnect: { maxAttempts: 3, baseDelayMs: 100, maxDelayMs: 1000 },
      });

      const p = client.connect();
      FakeSocket.instances[0].open();
      await p;
      expect(FakeSocket.instances.length).toBe(1);

      // 연결이 예기치 않게 끊김
      FakeSocket.instances[0].fail();
      // 다음 tick에 재연결
      await new Promise((r) => setTimeout(r, 10));
      FakeSocket.instances[1]?.open();
      await new Promise((r) => setTimeout(r, 10));

      expect(FakeSocket.instances.length).toBeGreaterThanOrEqual(2);
      expect(sleep).toHaveBeenCalled();
    });

    it("maxAttempts 초과 시 포기하고 isConnected는 false", async () => {
      const client = makeClient({
        reconnect: { maxAttempts: 2, baseDelayMs: 1, maxDelayMs: 10 },
      });
      const p = client.connect();
      FakeSocket.instances[0].open();
      await p;

      // 계속 실패
      FakeSocket.instances[0].fail();
      // 각 재시도가 fail로 이어지도록 여러 tick 대기
      for (let i = 0; i < 5; i++) {
        await new Promise((r) => setTimeout(r, 5));
        const latest = FakeSocket.instances[FakeSocket.instances.length - 1];
        if (latest && latest.readyState === FakeSocket.OPEN) {
          latest.fail();
        } else if (latest && latest.readyState !== FakeSocket.CLOSED) {
          latest.fail();
        }
      }

      expect(client.isConnected()).toBe(false);
    });

    it("수동 close 후에는 재연결을 시도하지 않는다", async () => {
      const client = makeClient();
      const p = client.connect();
      FakeSocket.instances[0].open();
      await p;

      client.close();
      const before = FakeSocket.instances.length;
      await new Promise((r) => setTimeout(r, 20));
      expect(FakeSocket.instances.length).toBe(before);
    });

    it("백오프 지연은 최대값에서 멈춘다", async () => {
      const sleep = vi.fn((_ms: number) => Promise.resolve());
      const client = makeClient({
        sleep,
        reconnect: { maxAttempts: 10, baseDelayMs: 100, maxDelayMs: 250 },
      });
      const p = client.connect();
      FakeSocket.instances[0].open();
      await p;

      FakeSocket.instances[0].fail();
      await new Promise((r) => setTimeout(r, 5));
      // 첫 재시도도 실패
      FakeSocket.instances[1]?.fail();
      await new Promise((r) => setTimeout(r, 5));

      const delays = sleep.mock.calls.map((c) => c[0] as number);
      // 모든 delay는 250 이하
      for (const d of delays) {
        expect(d).toBeLessThanOrEqual(250);
      }
    });
  });

  describe("리스너 해제", () => {
    it("on이 반환한 함수로 구독을 해제한다", async () => {
      const client = makeClient();
      const listener = vi.fn();
      const unsub = client.on(listener);

      const p = client.connect();
      FakeSocket.instances[0].open();
      await p;

      unsub();
      FakeSocket.instances[0].recv(
        JSON.stringify({ type: "item_deleted", item_id: "itm_1" })
      );
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
