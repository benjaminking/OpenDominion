import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GameServerClient } from '../src/GameServerClient';

class MockWebSocket {
  public static OPEN = 1;
  public static instances: MockWebSocket[] = [];

  public readonly url: string;
  public readyState = 0;
  public onopen: (() => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public onclose: (() => void) | null = null;
  public send = vi.fn();
  public close = vi.fn();

  public constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }
}

describe('GameServerClient', () => {
  const originalWebSocket = globalThis.WebSocket;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket as unknown as typeof WebSocket);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    globalThis.WebSocket = originalWebSocket;
    vi.restoreAllMocks();
  });

  it('connects successfully and logs the open event', async () => {
    const client = new GameServerClient('ws://localhost:3000');
    const connectPromise = client.connect();
    const socket = MockWebSocket.instances[0];

    socket.readyState = MockWebSocket.OPEN;
    socket.onopen?.();

    await expect(connectPromise).resolves.toBeUndefined();
    expect(socket.url).toBe('ws://localhost:3000');
    expect(logSpy).toHaveBeenCalledWith('Connected to server');
  });

  it('rejects connect when the websocket emits an error', async () => {
    const client = new GameServerClient('ws://localhost:3000');
    const connectPromise = client.connect();
    const socket = MockWebSocket.instances[0];

    socket.onerror?.({} as Event);

    await expect(connectPromise).rejects.toThrow('WebSocket connection failed');
    expect(errorSpy).toHaveBeenCalledWith('WebSocket error:', expect.any(Object));
  });

  it('sends serialized data only when the websocket is open', async () => {
    const client = new GameServerClient('ws://localhost:3000');
    const connectPromise = client.connect();
    const socket = MockWebSocket.instances[0];

    client.send({ action: 'join' });
    expect(socket.send).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('WebSocket is not connected');

    socket.readyState = MockWebSocket.OPEN;
    socket.onopen?.();
    await connectPromise;

    client.send({ action: 'join' });

    expect(socket.send).toHaveBeenCalledWith(JSON.stringify({ action: 'join' }));
  });

  it('invokes registered handlers for parsed messages and logs parse failures', async () => {
    const client = new GameServerClient('ws://localhost:3000');
    const connectPromise = client.connect();
    const socket = MockWebSocket.instances[0];
    const handlerA = vi.fn();
    const handlerB = vi.fn();

    socket.readyState = MockWebSocket.OPEN;
    socket.onopen?.();
    await connectPromise;

    client.on('joined', handlerA);
    client.on('updated', handlerB);

    socket.onmessage?.({ data: JSON.stringify({ type: 'joined', payload: 1 }) } as MessageEvent);

    expect(handlerA).toHaveBeenCalledWith({ type: 'joined', payload: 1 });
    expect(handlerB).toHaveBeenCalledWith({ type: 'joined', payload: 1 });
    expect(logSpy).toHaveBeenCalledWith('Received from server:', { type: 'joined', payload: 1 });

    socket.onmessage?.({ data: 'not json' } as MessageEvent);
    expect(errorSpy).toHaveBeenCalledWith('Failed to parse message:', expect.any(SyntaxError));
  });

  it('closes the websocket on disconnect and logs close events', async () => {
    const client = new GameServerClient('ws://localhost:3000');
    const connectPromise = client.connect();
    const socket = MockWebSocket.instances[0];

    socket.readyState = MockWebSocket.OPEN;
    socket.onopen?.();
    await connectPromise;

    client.disconnect();
    expect(socket.close).toHaveBeenCalledTimes(1);

    socket.onclose?.();
    expect(logSpy).toHaveBeenCalledWith('Disconnected from server');
  });
});
