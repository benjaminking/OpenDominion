import { describe, expect, it, vi, beforeEach } from 'vitest';

const tableModelMock = vi.hoisted(() => ({
  create: vi.fn(),
  find: vi.fn(),
  findById: vi.fn(),
  findByIdAndDelete: vi.fn(),
}));

vi.mock('../src/models/Table', () => ({
  TableModel: tableModelMock,
}));

import { TableService } from '../src/tables/table.service';

function createTableDocument(overrides: Record<string, unknown> = {}) {
  const document = {
    _id: { toString: () => 'table-1' },
    name: 'Friendly Table',
    ownerUserId: 'owner-1',
    ownerUsername: 'owner',
    status: 'OPEN',
    maxPlayers: 4,
    requiredCardNames: ['Village'],
    useColoniesPlatinum: false,
    useShelters: false,
    closedSeatIndexes: [],
    rematchProposedByUserId: undefined,
    rematchAcceptedUserIds: [],
    rematchUnavailable: false,
    seats: [
      {
        seatIndex: 0,
        userId: 'owner-1',
        username: 'owner',
        isBot: false,
      },
    ],
    createdAt: new Date('2026-05-25T00:00:00.000Z'),
    updatedAt: new Date('2026-05-25T00:00:00.000Z'),
    startedAt: undefined,
    save: vi.fn(async function save(this: Record<string, unknown>) {
      return this;
    }),
    ...overrides,
  };

  return document;
}

describe('TableService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a table with the owner already seated and normalized card names', async () => {
    const tableDoc = createTableDocument();
    tableModelMock.create.mockResolvedValue(tableDoc);

    const service = new TableService();
    const table = await service.createTable(
      { userId: 'owner-1', username: 'owner' },
      {
        name: '  Friendly Table  ',
        maxPlayers: 4,
        requiredCardNames: ['Village', 'Village', ' Smithy '],
      },
    );

    expect(tableModelMock.create).toHaveBeenCalledWith({
      name: 'Friendly Table',
      ownerUserId: 'owner-1',
      ownerUsername: 'owner',
      status: 'OPEN',
      maxPlayers: 4,
      requiredCardNames: ['Village', 'Smithy'],
      useColoniesPlatinum: false,
      useShelters: false,
      closedSeatIndexes: [],
      rematchAcceptedUserIds: [],
      rematchUnavailable: false,
      seats: [
        {
          seatIndex: 0,
          userId: 'owner-1',
          username: 'owner',
          isBot: false,
        },
      ],
    });
    expect(table.seats).toHaveLength(1);
    expect(table.requiredCardNames).toEqual(['Village']);
  });

  it('joins an open table and deletes the table when the owner leaves', async () => {
    const tableDoc = createTableDocument({
      seats: [
        { seatIndex: 0, userId: 'owner-1', username: 'owner', isBot: false },
        { seatIndex: 1, userId: 'player-2', username: 'player', isBot: false },
      ],
      maxPlayers: 4,
    });
    tableModelMock.findById.mockResolvedValue(tableDoc);

    const service = new TableService();
    const joinedTable = await service.joinTable({ userId: 'player-3', username: 'third' }, { tableId: 'table-1' });

    expect(joinedTable.seats).toHaveLength(3);
    expect(tableDoc.save).toHaveBeenCalledTimes(1);

    tableModelMock.findById.mockResolvedValueOnce(tableDoc);
    const afterLeave = await service.leaveTable({ userId: 'owner-1', username: 'owner' }, 'table-1');

    expect(afterLeave).toBeNull();
    expect(tableModelMock.findByIdAndDelete).toHaveBeenCalledWith('table-1');
  });

  it('starts a table by marking it in-game and setting the start timestamp', async () => {
    const tableDoc = createTableDocument({
      maxPlayers: 2,
      seats: [
        { seatIndex: 0, userId: 'owner-1', username: 'owner', isBot: false },
        { seatIndex: 1, userId: 'player-2', username: 'player', isBot: false },
      ],
    });
    tableModelMock.findById.mockResolvedValue(tableDoc);

    const service = new TableService();
    const table = await service.startTable({ userId: 'owner-1', username: 'owner' }, 'table-1');

    expect(table.status).toBe('IN_GAME');
    expect(table.startedAt).toBeInstanceOf(Date);
    expect(tableDoc.save).toHaveBeenCalledTimes(1);
  });

  it('lets owner set an unfilled seat to bot and closed via seat-state updates', async () => {
    const tableDoc = createTableDocument({
      maxPlayers: 4,
      seats: [{ seatIndex: 0, userId: 'owner-1', username: 'owner', isBot: false }],
      closedSeatIndexes: [],
      requiredCardNames: [],
    });
    tableModelMock.findById.mockResolvedValue(tableDoc);

    const service = new TableService();
    const withBot = await service.setSeatState(
      { userId: 'owner-1', username: 'owner' },
      { tableId: 'table-1', seatIndex: 2, state: 'BOT', botName: 'SmithyBMBot' },
    );

    expect(withBot.seats.find((seat) => seat.seatIndex === 2)?.isBot).toBe(true);
    expect(withBot.requiredCardNames).toEqual(['Smithy']);

    tableModelMock.findById.mockResolvedValue(tableDoc);
    const withOpen = await service.setSeatState(
      { userId: 'owner-1', username: 'owner' },
      { tableId: 'table-1', seatIndex: 2, state: 'OPEN' },
    );

    expect(withOpen.requiredCardNames).toEqual([]);

    tableModelMock.findById.mockResolvedValue(tableDoc);
    const withClosed = await service.setSeatState(
      { userId: 'owner-1', username: 'owner' },
      { tableId: 'table-1', seatIndex: 3, state: 'CLOSED' },
    );

    expect(withClosed.closedSeatIndexes).toContain(3);
  });

  it('adds and removes bot-required cards when bots are added and removed', async () => {
    const tableDoc = createTableDocument({
      maxPlayers: 3,
      seats: [{ seatIndex: 0, userId: 'owner-1', username: 'owner', isBot: false }],
      requiredCardNames: ['Village'],
      closedSeatIndexes: [],
    });
    tableModelMock.findById.mockResolvedValue(tableDoc);

    const service = new TableService();
    const withFirstBot = await service.addBot(
      { userId: 'owner-1', username: 'owner' },
      { tableId: 'table-1', botName: 'MilitiaBMBot' },
    );

    expect(withFirstBot.requiredCardNames).toEqual(['Village', 'Militia']);

    tableModelMock.findById.mockResolvedValue(tableDoc);
    const withSecondBot = await service.addBot(
      { userId: 'owner-1', username: 'owner' },
      { tableId: 'table-1', botName: 'SmithyBMBot' },
    );

    expect(withSecondBot.requiredCardNames).toEqual(['Village', 'Militia', 'Smithy']);

    const militiaSeatIndex = withSecondBot.seats.find(
      (seat) => seat.isBot && seat.username === 'MilitiaBMBot',
    )?.seatIndex;
    expect(militiaSeatIndex).toBeDefined();
    if (militiaSeatIndex === undefined) {
      throw new Error('Militia bot seat missing in test setup');
    }

    tableModelMock.findById.mockResolvedValue(tableDoc);
    const afterRemoveMilitia = await service.removeBot(
      { userId: 'owner-1', username: 'owner' },
      { tableId: 'table-1', seatIndex: militiaSeatIndex },
    );

    expect(afterRemoveMilitia.requiredCardNames).toEqual(['Village', 'Smithy']);
  });

  it('blocks start until every open seat is filled', async () => {
    const tableDoc = createTableDocument({
      maxPlayers: 4,
      seats: [
        { seatIndex: 0, userId: 'owner-1', username: 'owner', isBot: false },
        { seatIndex: 1, userId: 'player-2', username: 'player', isBot: false },
      ],
      closedSeatIndexes: [3],
    });
    tableModelMock.findById.mockResolvedValue(tableDoc);

    const service = new TableService();

    await expect(service.startTable({ userId: 'owner-1', username: 'owner' }, 'table-1')).rejects.toThrow(
      'All seats must be filled before starting',
    );
  });

  it('requires all human players to accept a proposed rematch before reopening the table', async () => {
    const tableDoc = createTableDocument({
      status: 'CLOSED',
      maxPlayers: 3,
      seats: [
        { seatIndex: 0, userId: 'owner-1', username: 'owner', isBot: false },
        { seatIndex: 1, userId: 'player-2', username: 'player-2', isBot: false },
        { seatIndex: 2, username: 'MilitiaBMBot', isBot: true },
      ],
      rematchAcceptedUserIds: [],
      rematchUnavailable: false,
    });
    tableModelMock.findById.mockResolvedValue(tableDoc);

    const service = new TableService();
    const afterProposal = await service.proposeRematch({ userId: 'owner-1', username: 'owner' }, 'table-1');

    expect(afterProposal.status).toBe('CLOSED');
    expect(afterProposal.rematch.proposedByUserId).toBe('owner-1');
    expect(afterProposal.rematch.acceptedUserIds).toEqual(['owner-1']);

    tableModelMock.findById.mockResolvedValue(tableDoc);
    const afterAccept = await service.acceptRematch({ userId: 'player-2', username: 'player-2' }, 'table-1');

    expect(afterAccept.status).toBe('OPEN');
    expect(afterAccept.rematch.proposedByUserId).toBeUndefined();
    expect(afterAccept.rematch.acceptedUserIds).toEqual([]);
    expect(afterAccept.rematch.unavailable).toBe(false);
  });

  it('marks rematch unavailable if a player leaves after game completion', async () => {
    const tableDoc = createTableDocument({
      status: 'CLOSED',
      seats: [
        { seatIndex: 0, userId: 'owner-1', username: 'owner', isBot: false },
        { seatIndex: 1, userId: 'player-2', username: 'player-2', isBot: false },
      ],
      rematchProposedByUserId: 'owner-1',
      rematchAcceptedUserIds: ['owner-1'],
      rematchUnavailable: false,
    });
    tableModelMock.findById.mockResolvedValue(tableDoc);

    const service = new TableService();
    const afterLeave = await service.leaveTable({ userId: 'player-2', username: 'player-2' }, 'table-1');

    expect(afterLeave?.rematch.unavailable).toBe(true);
    expect(afterLeave?.rematch.proposedByUserId).toBeUndefined();
    expect(afterLeave?.rematch.acceptedUserIds).toEqual([]);

    tableModelMock.findById.mockResolvedValue(tableDoc);
    await expect(service.proposeRematch({ userId: 'owner-1', username: 'owner' }, 'table-1')).rejects.toThrow(
      'Rematch is no longer possible for this table',
    );
  });
});
