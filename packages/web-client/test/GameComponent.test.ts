import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { GameComponent } from '../src/app/game.component';
import { MessageDecoderService } from '../src/app/message-decoder.service';
import { MessageWriterService } from '../src/app/message-writer.service';

class FakeWebSocket {
  static readonly OPEN = 1;
  static instances: FakeWebSocket[] = [];

  readonly send = vi.fn();
  readonly close = vi.fn();
  readonly url: string;
  readyState = 0;
  onopen?: () => void;
  onclose?: () => void;
  onerror?: (event: Event) => void;
  onmessage?: (event: MessageEvent) => void;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }
}

class FakeMessageDecoderService {
  readonly connect = vi.fn();
  mainPlayerNameCallback?: (content: { name: string }) => void;
  opponentNamesCallback?: (content: { names: string[] }) => void;
  turnStartCallback?: (content: { playerName: string }) => void;

  subscribeToMainPlayerName(callback: (content: { name: string }) => void): void {
    this.mainPlayerNameCallback = callback;
  }

  subscribeToOpponentNames(callback: (content: { names: string[] }) => void): void {
    this.opponentNamesCallback = callback;
  }

  subscribeToTurnStart(callback: (content: { playerName: string }) => void): void {
    this.turnStartCallback = callback;
  }
}

function createComponent() {
  const decoder = new FakeMessageDecoderService();
  const writer = {
    connect: vi.fn(),
  };
  const injector = Injector.create({
    providers: [
      { provide: MessageDecoderService, useValue: decoder },
      { provide: MessageWriterService, useValue: writer },
    ],
  });
  const component = runInInjectionContext(injector, () => new GameComponent());

  return { component, decoder, writer };
}

describe('GameComponent', () => {
  it('connects to the current host, wires websocket services, and updates state from events', () => {
    vi.stubGlobal('location', { protocol: 'http:', host: 'game.example' });
    vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { component, decoder, writer } = createComponent();

    component.connect();
    const ws = FakeWebSocket.instances[0];

    expect(ws.url).toBe('ws://game.example');
    expect(decoder.connect).toHaveBeenCalledWith(ws);
    expect(writer.connect).toHaveBeenCalledWith(ws);

    decoder.mainPlayerNameCallback?.({ name: 'Alice' });
    decoder.opponentNamesCallback?.({ names: ['Bob', 'Carol'] });
    decoder.turnStartCallback?.({ playerName: 'Bob' });
    expect(component.mainPlayerName()).toBe('Alice');
    expect(component.opponentNames()).toEqual(['Bob', 'Carol']);
    expect(component.allPlayerNames()).toEqual(['Alice', 'Bob', 'Carol']);
    expect(component.currentPlayerName()).toBe('Bob');

    ws.onopen?.();
    expect(component.status).toBe('connected');
    expect(component.messages()).toEqual(['Connected to server']);

    ws.onclose?.();
    expect(component.status).toBe('disconnected');
    expect(component.messages()).toEqual(['Connected to server', 'Disconnected']);

    ws.onerror?.(new Event('error'));
    expect(component.messages()).toEqual(['Connected to server', 'Disconnected', 'WebSocket error']);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

    consoleErrorSpy.mockRestore();
    vi.unstubAllGlobals();
    FakeWebSocket.instances = [];
  });

  it('sends messages only when the websocket is open and closes the socket on destroy', () => {
    vi.stubGlobal('location', { protocol: 'https:', host: 'secure.example' });
    vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket);
    const { component } = createComponent();

    component.ngOnInit();
    const ws = FakeWebSocket.instances[0];
    ws.readyState = FakeWebSocket.OPEN;
    component.messageToSend = 'ping';

    component.send();

    expect(ws.url).toBe('wss://secure.example');
    expect(ws.send).toHaveBeenCalledWith('ping');
    expect(component.messageToSend).toBe('');

    ws.readyState = 0;
    component.messageToSend = 'pong';
    component.send();
    expect(component.messages()).toContain('Not connected');

    component.ngOnDestroy();
    expect(ws.close).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
    FakeWebSocket.instances = [];
  });
});
