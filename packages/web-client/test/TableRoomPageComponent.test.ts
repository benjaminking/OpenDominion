import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, Subject, of } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../src/app/auth/auth.service';
import { AvatarService } from '../src/app/services/avatar.service';
import { GameSessionService } from '../src/app/services/game-session.service';
import { TableRoomPageComponent } from '../src/app/pages/table-room-page.component';
import { TableApiService, TableView } from '../src/app/services/table-api.service';

function makeTable(overrides: Partial<TableView> = {}): TableView {
  return {
    id: 'table-1',
    name: 'Test Table',
    ownerUserId: 'user-1',
    ownerUsername: 'alice',
    status: 'OPEN',
    maxPlayers: 2,
    requiredCardNames: [],
    seats: [],
    closedSeatIndexes: [],
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    ...overrides,
  };
}

type FakeSocket = { send: ReturnType<typeof vi.fn>; readyState: number };

function createComponent({
  tableId = '',
  messages = new Subject<string>(),
  socketForTableResult = null as FakeSocket | null,
} = {}) {
  const authService = {
    session: vi.fn(() => ({ userId: 'user-1', username: 'alice' })),
    accessToken: vi.fn(() => 'token'),
    clearSession: vi.fn(),
    logout: vi.fn(),
  };
  const gameSessionService = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    messages: vi.fn(() => messages.asObservable()),
    socketForTable: vi.fn(() => socketForTableResult),
    currentSocket: vi.fn(() => null),
    flushBuffer: vi.fn(() => []),
  };
  const tableApiService = {
    getTable: vi.fn(() => EMPTY),
    updateTableSettings: vi.fn(),
    setSeatState: vi.fn(),
    leaveTable: vi.fn(),
    startGame: vi.fn(),
    proposeRematch: vi.fn(),
    acceptRematch: vi.fn(),
    kickPlayer: vi.fn(),
  };
  const avatarService = {
    avatarFor: vi.fn(() => () => null),
    preload: vi.fn(),
  };
  const router = {
    getCurrentNavigation: vi.fn(() => null),
    navigateByUrl: vi.fn(),
    navigate: vi.fn(),
  };
  const activatedRoute = {
    snapshot: { paramMap: { get: vi.fn(() => tableId) } },
  };

  const injector = Injector.create({
    providers: [
      { provide: AuthService, useValue: authService },
      { provide: GameSessionService, useValue: gameSessionService },
      { provide: TableApiService, useValue: tableApiService },
      { provide: AvatarService, useValue: avatarService },
      { provide: Router, useValue: router },
      { provide: ActivatedRoute, useValue: activatedRoute },
    ],
  });

  const component = runInInjectionContext(
    injector,
    () =>
      new TableRoomPageComponent(
        injector.get(ActivatedRoute),
        injector.get(Router),
        injector.get(AuthService),
        injector.get(GameSessionService),
        injector.get(TableApiService),
        injector.get(AvatarService),
      ),
  );

  return { component, gameSessionService, tableApiService, router };
}

describe('TableRoomPageComponent', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ── chatSenderColor ───────────────────────────────────────────────────────

  it('returns a seat-based color for each occupied seat', () => {
    const { component } = createComponent();
    component.table.set(
      makeTable({
        seats: [
          { seatIndex: 0, userId: 'u1', username: 'alice', isBot: false },
          { seatIndex: 1, userId: 'u2', username: 'bob', isBot: false },
        ],
      }),
    );

    // Seat 0 → first palette color; seat 1 → second
    expect(component.chatSenderColor('alice')).toBe('#f5c542');
    expect(component.chatSenderColor('bob')).toBe('#5dd8c8');
  });

  it('returns the fallback color for a username not found in any seat', () => {
    const { component } = createComponent();
    component.table.set(makeTable({ seats: [] }));

    expect(component.chatSenderColor('ghost')).toBe('#7db8ff');
  });

  it('cycles seat colors when the seat index is >= the palette length', () => {
    const { component } = createComponent();
    component.table.set(
      makeTable({
        seats: [
          { seatIndex: 0, userId: 'u0', username: 'p0', isBot: false },
          { seatIndex: 4, userId: 'u4', username: 'p4', isBot: false }, // 4 % 4 = 0, same as index 0
        ],
      }),
    );

    expect(component.chatSenderColor('p4')).toBe(component.chatSenderColor('p0'));
  });

  // ── sendChatMessage ───────────────────────────────────────────────────────

  it('sends a chat JSON message over the socket and clears the input', () => {
    vi.stubGlobal('WebSocket', { OPEN: 1 });
    const fakeWs: FakeSocket = { send: vi.fn(), readyState: 1 };
    const { component } = createComponent({ socketForTableResult: fakeWs });

    component.chatInput.set('Hello everyone!');
    component.sendChatMessage();

    expect(fakeWs.send).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(fakeWs.send.mock.calls[0][0] as string) as {
      type: string;
      content: { text: string };
    };
    expect(payload.type).toBe('chat');
    expect(payload.content.text).toBe('Hello everyone!');
    expect(component.chatInput()).toBe('');
  });

  it('does nothing when the chat input is empty or whitespace only', () => {
    vi.stubGlobal('WebSocket', { OPEN: 1 });
    const fakeWs: FakeSocket = { send: vi.fn(), readyState: 1 };
    const { component } = createComponent({ socketForTableResult: fakeWs });

    component.chatInput.set('   ');
    component.sendChatMessage();

    expect(fakeWs.send).not.toHaveBeenCalled();
  });

  it('does nothing when the socket is null or not in the OPEN state', () => {
    vi.stubGlobal('WebSocket', { OPEN: 1 });

    // null socket
    const { component: c1 } = createComponent({ socketForTableResult: null });
    c1.chatInput.set('Hello!');
    c1.sendChatMessage();
    // no throw and no send to check

    // closed socket (readyState = 3)
    const closedWs: FakeSocket = { send: vi.fn(), readyState: 3 };
    const { component: c2 } = createComponent({ socketForTableResult: closedWs });
    c2.chatInput.set('Hello!');
    c2.sendChatMessage();
    expect(closedWs.send).not.toHaveBeenCalled();
  });

  // ── Incoming chat subscription ────────────────────────────────────────────

  it('appends incoming chat messages from the game session and ignores non-chat types', () => {
    const messages = new Subject<string>();
    const { component } = createComponent({ tableId: 'table-1', messages });

    component.ngOnInit();

    messages.next(JSON.stringify({ type: 'chat', content: { username: 'alice', text: 'hi', timestamp: 1 } }));
    messages.next(JSON.stringify({ type: 'chat', content: { username: 'bob', text: 'hey', timestamp: 2 } }));
    // Non-chat message should be ignored
    messages.next(JSON.stringify({ type: 'log', content: {} }));

    expect(component.chatMessages()).toEqual([
      { username: 'alice', text: 'hi', timestamp: 1 },
      { username: 'bob', text: 'hey', timestamp: 2 },
    ]);

    component.ngOnDestroy();
  });

  // ── Rematch helpers/actions ──────────────────────────────────────────────

  it('allows any seated human to propose rematch after game completes', () => {
    const { component } = createComponent();
    component.table.set(
      makeTable({
        status: 'CLOSED',
        seats: [
          { seatIndex: 0, userId: 'user-1', username: 'alice', isBot: false },
          { seatIndex: 1, userId: 'user-2', username: 'bob', isBot: false },
        ],
        rematch: { acceptedUserIds: [], unavailable: false },
      }),
    );

    expect(component.canProposeRematch()).toBe(true);
    expect(component.canAcceptRematch()).toBe(false);
  });

  it('tracks pending rematch acceptances and allows current user to accept once proposed', () => {
    const { component } = createComponent();
    component.table.set(
      makeTable({
        status: 'CLOSED',
        seats: [
          { seatIndex: 0, userId: 'user-1', username: 'alice', isBot: false },
          { seatIndex: 1, userId: 'user-2', username: 'bob', isBot: false },
          { seatIndex: 2, username: 'MilitiaBMBot', isBot: true },
        ],
        rematch: { proposedByUserId: 'user-2', acceptedUserIds: ['user-2'], unavailable: false },
      }),
    );

    expect(component.canProposeRematch()).toBe(false);
    expect(component.canAcceptRematch()).toBe(true);
    expect(component.acceptedRematchNames()).toEqual(['bob']);
    expect(component.pendingRematchNames()).toEqual(['alice']);
  });

  it('calls rematch APIs and applies returned table state', () => {
    const { component, tableApiService } = createComponent();
    component['tableId'] = 'table-1';

    const proposed = makeTable({
      status: 'CLOSED',
      rematch: { proposedByUserId: 'user-1', acceptedUserIds: ['user-1'], unavailable: false },
      seats: [
        { seatIndex: 0, userId: 'user-1', username: 'alice', isBot: false },
        { seatIndex: 1, userId: 'user-2', username: 'bob', isBot: false },
      ],
    });
    const reopened = makeTable({
      status: 'OPEN',
      rematch: { acceptedUserIds: [], unavailable: false },
      seats: [
        { seatIndex: 0, userId: 'user-1', username: 'alice', isBot: false },
        { seatIndex: 1, userId: 'user-2', username: 'bob', isBot: false },
      ],
    });

    tableApiService.proposeRematch.mockReturnValue(of({ table: proposed }));
    tableApiService.acceptRematch.mockReturnValue(of({ table: reopened }));

    component.proposeRematch();
    expect(tableApiService.proposeRematch).toHaveBeenCalledWith('table-1');
    expect(component.table()?.rematch?.proposedByUserId).toBe('user-1');

    component.acceptRematch();
    expect(tableApiService.acceptRematch).toHaveBeenCalledWith('table-1');
    expect(component.table()?.status).toBe('OPEN');
  });
});
