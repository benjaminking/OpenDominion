import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../src/app/auth/auth.service';
import { LobbySessionService } from '../src/app/services/lobby-session.service';

class FakeWebSocket {
  static readonly OPEN = 1;
  static readonly CONNECTING = 0;
  static instances: FakeWebSocket[] = [];

  readonly send = vi.fn();
  readonly close = vi.fn();
  readonly url: string;
  readyState = 0;
  onmessage?: (event: { data: string }) => void;
  onclose?: () => void;
  onerror?: () => void;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }
}

function createService(token: string | null = 'test-token') {
  const authService = {
    accessToken: vi.fn(() => token),
    session: vi.fn(() => null),
    clearSession: vi.fn(),
    logout: vi.fn(),
  };
  const injector = Injector.create({
    providers: [{ provide: AuthService, useValue: authService }],
  });
  const service = runInInjectionContext(injector, () => new LobbySessionService(injector.get(AuthService)));
  return { service, authService };
}

describe('LobbySessionService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    FakeWebSocket.instances = [];
  });

  it('opens a lobby socket (no tableId param) using a wss URL when the protocol is https', () => {
    vi.stubGlobal('location', { protocol: 'https:', host: 'game.example' });
    vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket);
    const { service } = createService('my-token');

    service.connect();

    expect(FakeWebSocket.instances).toHaveLength(1);
    const url = FakeWebSocket.instances[0].url;
    expect(url).toContain('my-token');
    expect(url).not.toContain('tableId');
    expect(url.startsWith('wss://')).toBe(true);
  });

  it('does not open a socket when the access token is absent', () => {
    vi.stubGlobal('location', { protocol: 'http:', host: 'game.example' });
    vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket);
    const { service } = createService(null);

    service.connect();

    expect(FakeWebSocket.instances).toHaveLength(0);
  });

  it('does not open a second socket when one is already connecting or open', () => {
    vi.stubGlobal('location', { protocol: 'http:', host: 'game.example' });
    vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket);
    const { service } = createService();

    service.connect(); // readyState = 0 (CONNECTING) by default
    service.connect();

    expect(FakeWebSocket.instances).toHaveLength(1);
  });

  it('closes the socket on disconnect and allows a new connection afterwards', () => {
    vi.stubGlobal('location', { protocol: 'http:', host: 'game.example' });
    vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket);
    const { service } = createService();

    service.connect();
    const firstWs = FakeWebSocket.instances[0];

    service.disconnect();
    expect(firstWs.close).toHaveBeenCalledTimes(1);

    service.connect();
    expect(FakeWebSocket.instances).toHaveLength(2);
  });

  it('sends a DM message as JSON over the socket when the socket is open', () => {
    vi.stubGlobal('location', { protocol: 'http:', host: 'game.example' });
    vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket);
    const { service } = createService();

    service.connect();
    const ws = FakeWebSocket.instances[0];
    ws.readyState = FakeWebSocket.OPEN;
    service.sendDm('bob-id', 'Hello bob!');

    expect(ws.send).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(ws.send.mock.calls[0][0] as string) as {
      type: string;
      content: { recipientUserId: string; text: string };
    };
    expect(payload.type).toBe('dm');
    expect(payload.content.recipientUserId).toBe('bob-id');
    expect(payload.content.text).toBe('Hello bob!');
  });

  it('does not send a DM when the socket is not in the OPEN state', () => {
    vi.stubGlobal('location', { protocol: 'http:', host: 'game.example' });
    vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket);
    const { service } = createService();

    service.connect(); // readyState = 0 (CONNECTING), not OPEN
    const ws = FakeWebSocket.instances[0];
    service.sendDm('bob-id', 'Hello?');

    expect(ws.send).not.toHaveBeenCalled();
  });

  it('relays incoming socket messages to messages() subscribers', () => {
    vi.stubGlobal('location', { protocol: 'http:', host: 'game.example' });
    vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket);
    const { service } = createService();

    const received: string[] = [];
    service.messages().subscribe((msg) => received.push(msg));

    service.connect();
    const ws = FakeWebSocket.instances[0];
    ws.onmessage?.({ data: '{"type":"dm","content":{"text":"hi"}}' });

    expect(received).toEqual(['{"type":"dm","content":{"text":"hi"}}']);
  });
});
