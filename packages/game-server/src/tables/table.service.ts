import { z } from 'zod';
import { HydratedDocument } from 'mongoose';
import { BotFactory } from '@dominion/local-bot-client';

import { TableEntity, TableModel, TableSeat } from '../models/Table';
import { AuthenticatedUser } from '../types/AuthenticatedRequest';

type TableDocument = HydratedDocument<TableEntity>;

const BOT_STRATEGY_NAMES = ['MilitiaBMBot', 'SmithyBMBot'] as const;
type BotStrategyName = (typeof BOT_STRATEGY_NAMES)[number];

const createTableSchema = z.object({
  name: z.string().trim().min(3).max(64),
  maxPlayers: z.number().int().min(2).max(6).default(2),
  requiredCardNames: z.array(z.string().trim().min(1).max(64)).max(20).default([]),
});

const updateTableSettingsSchema = z.object({
  name: z.string().trim().min(3).max(64).optional(),
  maxPlayers: z.number().int().min(2).max(6).optional(),
  requiredCardNames: z.array(z.string().trim().min(1).max(64)).max(20).optional(),
});

const joinTableSchema = z.object({
  tableId: z.string().min(1),
});

const kickPlayerSchema = z.object({
  tableId: z.string().min(1),
  userId: z.string().min(1),
});

const addBotSchema = z.object({
  tableId: z.string().min(1),
  botName: z.enum(BOT_STRATEGY_NAMES).default('MilitiaBMBot'),
});

const removeBotSchema = z.object({
  tableId: z.string().min(1),
  seatIndex: z.number().int().min(0),
});

const setSeatStateSchema = z.object({
  tableId: z.string().min(1),
  seatIndex: z.number().int().min(0),
  state: z.enum(['OPEN', 'CLOSED', 'BOT']),
  botName: z.enum(BOT_STRATEGY_NAMES).default('MilitiaBMBot'),
});

export type TableView = {
  id: string;
  name: string;
  ownerUserId: string;
  ownerUsername: string;
  status: 'OPEN' | 'IN_GAME' | 'CLOSED';
  maxPlayers: number;
  requiredCardNames: string[];
  seats: TableSeat[];
  closedSeatIndexes: number[];
  rematch: {
    proposedByUserId?: string;
    acceptedUserIds: string[];
    unavailable: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
};

function resetRematchState(table: TableDocument): void {
  table.rematchProposedByUserId = undefined;
  table.rematchAcceptedUserIds = [];
  table.rematchUnavailable = false;
}

function markRematchUnavailable(table: TableDocument): void {
  table.rematchProposedByUserId = undefined;
  table.rematchAcceptedUserIds = [];
  table.rematchUnavailable = true;
}

function humanSeats(table: TableDocument): TableSeat[] {
  return table.seats.filter((seat) => !seat.isBot && !!seat.userId);
}

function ensureSeatedHuman(table: TableDocument, user: AuthenticatedUser): void {
  const seated = table.seats.some((seat) => !seat.isBot && seat.userId === user.userId);
  if (!seated) {
    throw new Error('Only seated human players can perform this action');
  }
}

function ensureOpenTable(table: TableDocument): void {
  if (table.status !== 'OPEN') {
    throw new Error('Table is no longer open');
  }
}

function ensureOwner(table: TableDocument, user: AuthenticatedUser): void {
  if (table.ownerUserId !== user.userId) {
    throw new Error('Only the table owner can perform this action');
  }
}

function isUserInTable(table: TableDocument, userId: string): boolean {
  return table.seats.some((seat) => seat.userId === userId);
}

function normalizeRequiredCardNames(cardNames: string[]): string[] {
  return [...new Set(cardNames.map((value) => value.trim()).filter((value) => value.length > 0))];
}

function toBotStrategyName(botName: string): BotStrategyName {
  if ((BOT_STRATEGY_NAMES as readonly string[]).includes(botName)) {
    return botName as BotStrategyName;
  }
  throw new Error(`Unsupported bot strategy: ${botName}`);
}

function requiredCardsForBot(botName: BotStrategyName): string[] {
  return [...BotFactory.createRuleBasedBot(botName).requiredCardNames];
}

function requiredCardsForBotSeats(seats: TableSeat[]): Set<string> {
  const requiredCards = new Set<string>();
  for (const seat of seats) {
    if (!seat.isBot) {
      continue;
    }
    for (const requiredCardName of requiredCardsForBot(toBotStrategyName(seat.username))) {
      requiredCards.add(requiredCardName);
    }
  }
  return requiredCards;
}

function applySeatMutationAndSyncRequiredCards(table: TableDocument, mutateSeats: () => void): void {
  const botCardsBefore = requiredCardsForBotSeats(table.seats);
  const userManagedCards: string[] = table.requiredCardNames.filter((cardName) => !botCardsBefore.has(cardName));

  mutateSeats();

  const botCardsAfter = requiredCardsForBotSeats(table.seats);
  table.requiredCardNames = normalizeRequiredCardNames([...userManagedCards, ...botCardsAfter]);
}

function sortSeatsByIndex(table: TableDocument): void {
  table.seats.sort((left, right) => left.seatIndex - right.seatIndex);
}

function findSeatByIndex(table: TableDocument, seatIndex: number): TableSeat | undefined {
  return table.seats.find((seat) => seat.seatIndex === seatIndex);
}

function ensureOwnerAtSeatZero(table: TableDocument): void {
  const ownerSeat = table.seats.find((seat) => !seat.isBot && seat.userId === table.ownerUserId);
  if (!ownerSeat || ownerSeat.seatIndex === 0) {
    return;
  }

  const seatZero = findSeatByIndex(table, 0);
  if (seatZero) {
    seatZero.seatIndex = ownerSeat.seatIndex;
  }

  ownerSeat.seatIndex = 0;
  sortSeatsByIndex(table);
}

function firstJoinableSeatIndex(table: TableDocument): number {
  const closedSeatIndexes = new Set(table.closedSeatIndexes ?? []);
  for (let seatIndex = 0; seatIndex < table.maxPlayers; seatIndex += 1) {
    if (closedSeatIndexes.has(seatIndex)) {
      continue;
    }

    if (!findSeatByIndex(table, seatIndex)) {
      return seatIndex;
    }
  }

  return -1;
}

function tableToView(table: TableDocument): TableView {
  sortSeatsByIndex(table);

  return {
    id: table._id.toString(),
    name: table.name,
    ownerUserId: table.ownerUserId,
    ownerUsername: table.ownerUsername,
    status: table.status,
    maxPlayers: table.maxPlayers,
    requiredCardNames: [...table.requiredCardNames],
    seats: table.seats.map((seat) => ({
      seatIndex: seat.seatIndex,
      userId: seat.userId,
      username: seat.username,
      isBot: seat.isBot,
    })),
    closedSeatIndexes: [...(table.closedSeatIndexes ?? [])].sort((left, right) => left - right),
    rematch: {
      proposedByUserId: table.rematchProposedByUserId,
      acceptedUserIds: [...(table.rematchAcceptedUserIds ?? [])],
      unavailable: table.rematchUnavailable ?? false,
    },
    createdAt: table.createdAt,
    updatedAt: table.updatedAt,
    startedAt: table.startedAt,
  };
}

export class TableService {
  public async createTable(user: AuthenticatedUser, payload: unknown): Promise<TableView> {
    const parsed = createTableSchema.parse(payload);

    const initialSeat: TableSeat = {
      seatIndex: 0,
      userId: user.userId,
      username: user.username,
      isBot: false,
    };

    const table: TableDocument = await TableModel.create({
      name: parsed.name,
      ownerUserId: user.userId,
      ownerUsername: user.username,
      status: 'OPEN',
      maxPlayers: parsed.maxPlayers,
      requiredCardNames: normalizeRequiredCardNames(parsed.requiredCardNames),
      seats: [initialSeat],
      closedSeatIndexes: [],
      rematchAcceptedUserIds: [],
      rematchUnavailable: false,
    });

    return tableToView(table);
  }

  public async listOpenTables(): Promise<TableView[]> {
    const tables = await TableModel.find({ status: 'OPEN' }).sort({ createdAt: -1 });
    return tables.map(tableToView);
  }

  public async getTable(tableId: string): Promise<TableView | null> {
    const table = await TableModel.findById(tableId);
    if (!table) {
      return null;
    }

    return tableToView(table);
  }

  public async joinTable(user: AuthenticatedUser, payload: unknown): Promise<TableView> {
    const parsed = joinTableSchema.parse(payload);
    const table = await TableModel.findById(parsed.tableId);

    if (!table) {
      throw new Error('Table not found');
    }

    ensureOpenTable(table);

    if (isUserInTable(table, user.userId)) {
      return tableToView(table);
    }

    const seatIndex: number = firstJoinableSeatIndex(table);
    if (seatIndex < 0) {
      throw new Error('Table is full');
    }

    table.seats.push({
      seatIndex,
      userId: user.userId,
      username: user.username,
      isBot: false,
    });

    sortSeatsByIndex(table);
    ensureOwnerAtSeatZero(table);
    await table.save();
    return tableToView(table);
  }

  public async leaveTable(user: AuthenticatedUser, tableId: string): Promise<TableView | null> {
    const table = await TableModel.findById(tableId);

    if (!table) {
      throw new Error('Table not found');
    }

    if (table.ownerUserId === user.userId) {
      await this.deleteTable(tableId);
      return null;
    }

    if (table.status === 'IN_GAME') {
      throw new Error('Table is no longer open');
    }

    const previousLength: number = table.seats.length;
    table.seats = table.seats.filter((seat) => seat.userId !== user.userId);

    if (previousLength === table.seats.length) {
      throw new Error('Player not found in table');
    }

    if (table.status === 'CLOSED') {
      markRematchUnavailable(table);
    }

    if (table.seats.length === 0) {
      table.status = 'CLOSED';
      await table.save();
      return tableToView(table);
    }

    sortSeatsByIndex(table);
    ensureOwnerAtSeatZero(table);
    await table.save();
    return tableToView(table);
  }

  public async deleteTable(tableId: string): Promise<void> {
    await TableModel.findByIdAndDelete(tableId);
  }

  public async deleteOwnTable(user: AuthenticatedUser, tableId: string): Promise<void> {
    const table = await TableModel.findById(tableId);
    if (!table) {
      throw new Error('Table not found');
    }
    ensureOwner(table, user);
    await TableModel.findByIdAndDelete(tableId);
  }

  public async updateTableSettings(user: AuthenticatedUser, tableId: string, payload: unknown): Promise<TableView> {
    const parsed = updateTableSettingsSchema.parse(payload);
    const table = await TableModel.findById(tableId);

    if (!table) {
      throw new Error('Table not found');
    }

    ensureOpenTable(table);
    ensureOwner(table, user);

    if (parsed.name) {
      table.name = parsed.name;
    }

    if (typeof parsed.maxPlayers === 'number') {
      const nextMaxPlayers: number = parsed.maxPlayers;
      const highestSeatIndex = table.seats.reduce((max, seat) => Math.max(max, seat.seatIndex), -1);
      if (highestSeatIndex >= nextMaxPlayers) {
        throw new Error('maxPlayers cannot be lower than current occupied seat indexes');
      }

      table.maxPlayers = nextMaxPlayers;
      table.closedSeatIndexes = (table.closedSeatIndexes ?? []).filter((seatIndex) => seatIndex < nextMaxPlayers);
    }

    if (parsed.requiredCardNames) {
      table.requiredCardNames = normalizeRequiredCardNames(parsed.requiredCardNames);
    }

    ensureOwnerAtSeatZero(table);
    await table.save();
    return tableToView(table);
  }

  public async kickPlayer(user: AuthenticatedUser, payload: unknown): Promise<TableView> {
    const parsed = kickPlayerSchema.parse(payload);
    const table = await TableModel.findById(parsed.tableId);

    if (!table) {
      throw new Error('Table not found');
    }

    ensureOpenTable(table);
    ensureOwner(table, user);

    if (parsed.userId === user.userId) {
      throw new Error('Owner cannot kick themselves');
    }

    const previousLength: number = table.seats.length;
    table.seats = table.seats.filter((seat) => seat.userId !== parsed.userId);

    if (previousLength === table.seats.length) {
      throw new Error('Player not found in table');
    }

    sortSeatsByIndex(table);
    ensureOwnerAtSeatZero(table);
    await table.save();
    return tableToView(table);
  }

  public async addBot(user: AuthenticatedUser, payload: unknown): Promise<TableView> {
    const parsed = addBotSchema.parse(payload);
    const table = await TableModel.findById(parsed.tableId);

    if (!table) {
      throw new Error('Table not found');
    }

    ensureOpenTable(table);
    ensureOwner(table, user);

    const seatIndex: number = firstJoinableSeatIndex(table);
    if (seatIndex < 0) {
      throw new Error('Table is full');
    }

    applySeatMutationAndSyncRequiredCards(table, () => {
      table.seats.push({
        seatIndex,
        isBot: true,
        username: parsed.botName,
      });
    });

    sortSeatsByIndex(table);
    ensureOwnerAtSeatZero(table);
    await table.save();
    return tableToView(table);
  }

  public async removeBot(user: AuthenticatedUser, payload: unknown): Promise<TableView> {
    const parsed = removeBotSchema.parse(payload);
    const table = await TableModel.findById(parsed.tableId);

    if (!table) {
      throw new Error('Table not found');
    }

    ensureOpenTable(table);
    ensureOwner(table, user);

    const targetSeat = table.seats.find((seat) => seat.seatIndex === parsed.seatIndex);
    if (!targetSeat || !targetSeat.isBot) {
      throw new Error('Bot seat not found');
    }

    applySeatMutationAndSyncRequiredCards(table, () => {
      table.seats = table.seats.filter((seat) => seat.seatIndex !== parsed.seatIndex);
    });

    sortSeatsByIndex(table);
    ensureOwnerAtSeatZero(table);
    await table.save();
    return tableToView(table);
  }

  public async setSeatState(user: AuthenticatedUser, payload: unknown): Promise<TableView> {
    const parsed = setSeatStateSchema.parse(payload);
    const table = await TableModel.findById(parsed.tableId);

    if (!table) {
      throw new Error('Table not found');
    }

    ensureOpenTable(table);
    ensureOwner(table, user);

    if (parsed.seatIndex < 0 || parsed.seatIndex >= table.maxPlayers) {
      throw new Error('Seat index is out of range for this table');
    }

    if (parsed.seatIndex === 0) {
      throw new Error('Owner seat cannot be modified');
    }

    const closedSeatIndexes = new Set(table.closedSeatIndexes ?? []);

    applySeatMutationAndSyncRequiredCards(table, () => {
      if (parsed.state === 'OPEN') {
        table.seats = table.seats.filter((seat) => seat.seatIndex !== parsed.seatIndex || !seat.isBot);
        closedSeatIndexes.delete(parsed.seatIndex);
      }

      if (parsed.state === 'CLOSED') {
        // Remove any occupant, including human players
        table.seats = table.seats.filter((seat) => seat.seatIndex !== parsed.seatIndex);
        closedSeatIndexes.add(parsed.seatIndex);
      }

      if (parsed.state === 'BOT') {
        // Remove any existing occupant, including human players
        table.seats = table.seats.filter((seat) => seat.seatIndex !== parsed.seatIndex);
        table.seats.push({
          seatIndex: parsed.seatIndex,
          isBot: true,
          username: parsed.botName,
        });
        closedSeatIndexes.delete(parsed.seatIndex);
      }
    });

    table.closedSeatIndexes = [...closedSeatIndexes].sort((left, right) => left - right);
    sortSeatsByIndex(table);
    ensureOwnerAtSeatZero(table);
    await table.save();
    return tableToView(table);
  }

  public async startTable(user: AuthenticatedUser, tableId: string): Promise<TableView> {
    const table = await TableModel.findById(tableId);

    if (!table) {
      throw new Error('Table not found');
    }

    ensureOpenTable(table);
    ensureOwner(table, user);

    const closedSeatIndexes = table.closedSeatIndexes ?? [];
    const activeSeatCount: number = table.maxPlayers - closedSeatIndexes.length;

    if (activeSeatCount < 2) {
      throw new Error('At least two open seats are required to start a game');
    }

    if (table.seats.length < activeSeatCount) {
      throw new Error('All seats must be filled before starting');
    }

    ensureOwnerAtSeatZero(table);
    resetRematchState(table);
    table.status = 'IN_GAME';
    table.startedAt = new Date();

    await table.save();
    return tableToView(table);
  }

  public async closeTable(tableId: string): Promise<void> {
    await TableModel.findByIdAndUpdate(tableId, {
      status: 'CLOSED',
      rematchProposedByUserId: undefined,
      rematchAcceptedUserIds: [],
      rematchUnavailable: false,
    });
  }

  public async proposeRematch(user: AuthenticatedUser, tableId: string): Promise<TableView> {
    const table = await TableModel.findById(tableId);

    if (!table) {
      throw new Error('Table not found');
    }

    if (table.status !== 'CLOSED') {
      throw new Error('Rematch is only available after a completed game');
    }
    if (table.rematchUnavailable) {
      throw new Error('Rematch is no longer possible for this table');
    }

    ensureSeatedHuman(table, user);

    if (!table.rematchProposedByUserId) {
      table.rematchProposedByUserId = user.userId;
    }
    if (!table.rematchAcceptedUserIds.includes(user.userId)) {
      table.rematchAcceptedUserIds.push(user.userId);
    }

    const humans: TableSeat[] = humanSeats(table);
    const allAccepted = humans.every((seat) =>
      !!seat.userId && table.rematchAcceptedUserIds.includes(seat.userId),
    );

    if (allAccepted) {
      table.status = 'OPEN';
      table.startedAt = undefined;
      resetRematchState(table);
    }

    await table.save();
    return tableToView(table);
  }

  public async acceptRematch(user: AuthenticatedUser, tableId: string): Promise<TableView> {
    const table = await TableModel.findById(tableId);

    if (!table) {
      throw new Error('Table not found');
    }

    if (table.status !== 'CLOSED') {
      throw new Error('Rematch is only available after a completed game');
    }
    if (table.rematchUnavailable) {
      throw new Error('Rematch is no longer possible for this table');
    }
    if (!table.rematchProposedByUserId) {
      throw new Error('No rematch has been proposed');
    }

    ensureSeatedHuman(table, user);

    if (!table.rematchAcceptedUserIds.includes(user.userId)) {
      table.rematchAcceptedUserIds.push(user.userId);
    }

    const humans: TableSeat[] = humanSeats(table);
    const allAccepted = humans.every((seat) =>
      !!seat.userId && table.rematchAcceptedUserIds.includes(seat.userId),
    );

    if (allAccepted) {
      table.status = 'OPEN';
      table.startedAt = undefined;
      resetRematchState(table);
    }

    await table.save();
    return tableToView(table);
  }
}
