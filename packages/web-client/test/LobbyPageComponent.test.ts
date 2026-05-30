import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '../src/app/auth/auth.service';
import { LobbyPageComponent } from '../src/app/pages/lobby-page.component';
import { AvatarService } from '../src/app/services/avatar.service';
import { LobbySessionService } from '../src/app/services/lobby-session.service';
import { LobbyUserView, TableApiService, TableView } from '../src/app/services/table-api.service';

function makeTable(overrides: Partial<TableView> = {}): TableView {
  return {
    id: 'table-1',
    name: 'Test Table',
    ownerUserId: 'owner-1',
    ownerUsername: 'owner',
    status: 'OPEN',
    maxPlayers: 2,
    requiredCardNames: [],
    useColoniesPlatinum: false,
    useShelters: false,
    seats: [],
    closedSeatIndexes: [],
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    ...overrides,
  };
}

function createComponent(tableApiOverrides?: Partial<TableApiService>) {
  const dmMessages$ = new Subject<string>();
  const authService = {
    session: vi.fn(() => ({ userId: 'user-1', username: 'alice' })),
    clearSession: vi.fn(),
    logout: vi.fn(),
  };
  const tableApiService = {
    listTables: vi.fn(() => of({ tables: [] })),
    listUsers: vi.fn(() => of({ users: [] })),
    createTable: vi.fn(),
    joinTable: vi.fn(),
    deleteTable: vi.fn(),
    ...tableApiOverrides,
  };
  const avatarService = {
    avatarFor: vi.fn(() => () => null),
    preload: vi.fn(),
  };
  const lobbySessionService = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    sendDm: vi.fn(),
    messages: vi.fn(() => dmMessages$.asObservable()),
  };
  const router = {
    navigateByUrl: vi.fn(),
    navigate: vi.fn(),
  };

  const injector = Injector.create({
    providers: [
      { provide: AuthService, useValue: authService },
      { provide: TableApiService, useValue: tableApiService },
      { provide: AvatarService, useValue: avatarService },
      { provide: LobbySessionService, useValue: lobbySessionService },
      { provide: Router, useValue: router },
    ],
  });

  const component = runInInjectionContext(
    injector,
    () =>
      new LobbyPageComponent(
        injector.get(AuthService),
        injector.get(TableApiService),
        injector.get(AvatarService),
        injector.get(LobbySessionService),
        injector.get(Router),
      ),
  );

  return { component, dmMessages$, authService, tableApiService, lobbySessionService, router };
}

describe('LobbyPageComponent', () => {
  it('clears the initial loading state and stores returned tables after a successful load', () => {
    const returnedTables = [
      {
        id: 'table-1',
        name: 'Evening Draft',
        ownerUserId: 'owner-1',
        ownerUsername: 'owner',
        status: 'OPEN' as const,
        maxPlayers: 4,
        requiredCardNames: ['Village'],
        useColoniesPlatinum: false,
        useShelters: false,
        seats: [],
        closedSeatIndexes: [],
        createdAt: '2026-05-25T00:00:00.000Z',
        updatedAt: '2026-05-25T00:00:00.000Z',
      },
    ];
    const { component } = createComponent({
      listTables: vi.fn(() => of({ tables: returnedTables })),
    });

    component.loadTables();

    expect(component.hasLoadedTables()).toBe(true);
    expect(component.isLoading()).toBe(false);
    expect(component.tables()).toEqual(returnedTables);
    expect(component.errorMessage()).toBe('');
  });

  it('stops loading and surfaces an error when the table request fails', () => {
    const { component } = createComponent({
      listTables: vi.fn(() => throwError(() => ({ error: { error: 'Boom' } }))),
    });

    component.loadTables();

    expect(component.hasLoadedTables()).toBe(true);
    expect(component.isLoading()).toBe(false);
    expect(component.errorMessage()).toBe('Boom');
  });

  // ── openChat / closeChat ──────────────────────────────────────────────────

  it('sets the DM target and loads history when opening a chat with a user', () => {
    const { component } = createComponent();
    const user: LobbyUserView = { id: 'user-2', username: 'bob', online: true };

    component.openChat(user);

    expect(component.dmTarget()).toEqual(user);
    expect(component.dmMessages()).toEqual([]);
  });

  it('does nothing when opening a chat with the already-active target', () => {
    const { component } = createComponent();
    const user: LobbyUserView = { id: 'user-2', username: 'bob', online: true };
    component.openChat(user);
    component.dmMessages.set([{ senderUserId: 'user-2', senderUsername: 'bob', text: 'hi', timestamp: 1 }]);

    // Re-opening the same user should be a no-op
    component.openChat(user);

    // Messages remain unchanged (not reset to empty)
    expect(component.dmMessages()).toHaveLength(1);
  });

  it('clears the DM target and messages on closeChat', () => {
    const { component } = createComponent();
    const user: LobbyUserView = { id: 'user-2', username: 'bob', online: true };
    component.openChat(user);

    component.closeChat();

    expect(component.dmTarget()).toBeNull();
    expect(component.dmMessages()).toEqual([]);
  });

  // ── sendDmMessage ─────────────────────────────────────────────────────────

  it('sends a DM, appends it to the conversation, and clears the input', () => {
    const { component, lobbySessionService } = createComponent();
    const target: LobbyUserView = { id: 'user-2', username: 'bob', online: true };
    component.openChat(target);
    component.dmInput.set('Hello bob!');

    component.sendDmMessage();

    expect(lobbySessionService.sendDm).toHaveBeenCalledWith('user-2', 'Hello bob!');
    expect(component.dmMessages()).toHaveLength(1);
    expect(component.dmMessages()[0].text).toBe('Hello bob!');
    expect(component.dmMessages()[0].senderUsername).toBe('alice');
    expect(component.dmInput()).toBe('');
  });

  it('does not send when the input is empty or there is no active DM target', () => {
    const { component, lobbySessionService } = createComponent();
    const target: LobbyUserView = { id: 'user-2', username: 'bob', online: true };

    // No target set
    component.dmInput.set('Hello!');
    component.sendDmMessage();
    expect(lobbySessionService.sendDm).not.toHaveBeenCalled();

    // Target set but input is whitespace
    component.openChat(target);
    component.dmInput.set('   ');
    component.sendDmMessage();
    expect(lobbySessionService.sendDm).not.toHaveBeenCalled();
  });

  // ── isUserInTable ─────────────────────────────────────────────────────────

  it('returns true when the user occupies a seat in any loaded table', () => {
    const { component } = createComponent();
    component.tables.set([makeTable({ seats: [{ seatIndex: 0, userId: 'user-2', username: 'bob', isBot: false }] })]);

    expect(component.isUserInTable('user-2')).toBe(true);
    expect(component.isUserInTable('user-3')).toBe(false);
  });

  // ── Auto-open DM on incoming message ──────────────────────────────────────

  it('opens the chat panel when an unsolicited DM arrives from another user', () => {
    const { component, dmMessages$ } = createComponent();
    component.ngOnInit();

    const dmPayload = JSON.stringify({
      type: 'dm',
      content: { senderUserId: 'user-2', senderUsername: 'bob', text: 'Hey!', timestamp: 100 },
    });
    dmMessages$.next(dmPayload);

    expect(component.dmTarget()?.id).toBe('user-2');
    expect(component.dmMessages()).toHaveLength(1);
    expect(component.dmMessages()[0].text).toBe('Hey!');

    component.ngOnDestroy();
  });

  it('appends subsequent DMs from the same sender to the open conversation', () => {
    const { component, dmMessages$ } = createComponent();
    component.ngOnInit();

    const msg = (text: string) =>
      JSON.stringify({
        type: 'dm',
        content: { senderUserId: 'user-2', senderUsername: 'bob', text, timestamp: 1 },
      });

    dmMessages$.next(msg('First'));
    dmMessages$.next(msg('Second'));

    expect(component.dmMessages()).toHaveLength(2);
    expect(component.dmMessages()[1].text).toBe('Second');

    component.ngOnDestroy();
  });
});
