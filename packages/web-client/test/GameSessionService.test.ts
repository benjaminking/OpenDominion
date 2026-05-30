import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../src/app/auth/auth.service';
import { GameSessionService } from '../src/app/services/game-session.service';

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
  const service = runInInjectionContext(injector, () => new GameSessionService(injector.get(AuthService)));
  return { service, authService };
}

describe('GameSessionService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    FakeWebSocket.instances = [];
  });

  it('emits raw message strings to messages() subscribers when the socket receives data', () => {
    vi.stubGlobal('location', { protocol: 'http:', host: 'game.example' });
    vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket);
    const { service } = createService();

    const received: string[] = [];
    service.messages().subscribe((msg) => received.push(msg));

    service.connect('table-1');
    const ws = FakeWebSocket.instances[0];
    ws.onmessage?.({ data: '{"type":"chat","content":{"text":"hello"}}' });
    ws.onmessage?.({ data: '{"type":"chat","content":{"text":"world"}}' });

    expect(received).toEqual([
      '{"type":"chat","content":{"text":"hello"}}',
      '{"type":"chat","content":{"text":"world"}}',
    ]);
  });

  it('also buffers incoming messages so that flushBuffer returns and then clears them', () => {
    vi.stubGlobal('location', { protocol: 'http:', host: 'game.example' });
    vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket);
    const { service } = createService();

    service.connect('table-1');
    const ws = FakeWebSocket.instances[0];
    ws.onmessage?.({ data: 'msg-a' });
    ws.onmessage?.({ data: 'msg-b' });

    const flushed = service.flushBuffer();
    expect(flushed).toEqual(['msg-a', 'msg-b']);
    // Buffer is cleared after flush
    expect(service.flushBuffer()).toEqual([]);
  });
});
