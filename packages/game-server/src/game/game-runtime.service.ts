import { WebSocket } from 'ws';
import { GameInitializer, PlayerSpecification } from '@dominion/game-engine';
import { GameResult } from '@dominion/common';
import { BotClient } from '@dominion/local-bot-client';
import { WebClient } from '@dominion/web-client-backend';

import { TableView } from '../tables/table.service';

interface WaitingConnectionsByTable {
  [tableId: string]: Map<string, WebSocket>;
}

export class GameRuntimeService {
  private readonly waitingConnections: WaitingConnectionsByTable = {};
  private readonly activeGameConnections: { [tableId: string]: Map<string, WebSocket> } = {};
  private readonly startedTables: Set<string> = new Set();

  public registerWaitingConnection(tableId: string, userId: string, ws: WebSocket): void {
    const tableConnections: Map<string, WebSocket> = this.waitingConnections[tableId] ?? new Map<string, WebSocket>();
    tableConnections.set(userId, ws);
    this.waitingConnections[tableId] = tableConnections;

    ws.on('close', () => {
      const currentConnections: Map<string, WebSocket> | undefined = this.waitingConnections[tableId];
      if (currentConnections) {
        currentConnections.delete(userId);
      }

      const activeConnections: Map<string, WebSocket> | undefined = this.activeGameConnections[tableId];
      if (activeConnections) {
        activeConnections.delete(userId);
      }
    });
  }

  public broadcastToTable(tableId: string, message: unknown): void {
    const connections = this.waitingConnections[tableId];
    if (!connections) return;
    const json = JSON.stringify(message);
    for (const ws of connections.values()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(json);
      }
    }
  }

  public canStartTable(table: TableView): boolean {
    const tableConnections: Map<string, WebSocket> | undefined = this.waitingConnections[table.id];
    if (!tableConnections) {
      return false;
    }

    return table.seats
      .filter((seat) => !seat.isBot && seat.userId)
      .every((seat) => {
        if (!seat.userId) return false;
        const ws = tableConnections.get(seat.userId);
        return !!ws && ws.readyState === WebSocket.OPEN;
      });
  }

  public startTableGame(table: TableView, onGameComplete?: (tableId: string, result: GameResult) => void): void {
    if (this.startedTables.has(table.id)) {
      throw new Error('Game already started for this table');
    }

    const tableConnections: Map<string, WebSocket> | undefined = this.waitingConnections[table.id];
    if (!tableConnections) {
      throw new Error('No active table player connections found');
    }

    const playerSpecs: PlayerSpecification[] = table.seats.map((seat) => {
      if (seat.isBot) {
        return new PlayerSpecification(seat.username, new BotClient(seat.username), true);
      }

      if (!seat.userId) {
        throw new Error('Missing user id for human seat');
      }

      const playerSocket: WebSocket | undefined = tableConnections.get(seat.userId);
      if (!playerSocket) {
        throw new Error('All human players must be connected before starting');
      }

      return new PlayerSpecification(seat.username, new WebClient(playerSocket));
    });

    // Preserve connections so we can broadcast the game result when the game ends.
    this.activeGameConnections[table.id] = new Map(tableConnections);

    const gameInitializer: GameInitializer = new GameInitializer(playerSpecs, table.requiredCardNames);
    void Promise.resolve(gameInitializer.runGame())
      .then((result: GameResult) => {
        this.broadcastGameResult(table.id, result);
        const activeConnections = this.activeGameConnections[table.id];
        if (activeConnections) {
          const waitingConnections = new Map<string, WebSocket>();
          for (const [userId, ws] of activeConnections.entries()) {
            if (ws.readyState === WebSocket.OPEN) {
              waitingConnections.set(userId, ws);
            }
          }
          this.waitingConnections[table.id] = waitingConnections;
        }
        this.startedTables.delete(table.id);
        delete this.activeGameConnections[table.id];
        onGameComplete?.(table.id, result);
      })
      .catch((error: unknown) => {
        console.error(`Unhandled game engine error for table ${table.id}:`, error);
        this.startedTables.delete(table.id);
        delete this.activeGameConnections[table.id];
      });
    this.startedTables.add(table.id);
    delete this.waitingConnections[table.id];
  }

  private broadcastGameResult(tableId: string, result: GameResult): void {
    const connections = this.activeGameConnections[tableId];
    if (!connections) return;
    const message = { type: 'game_result', content: result };
    const json = JSON.stringify(message);
    for (const ws of connections.values()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(json);
      }
    }
  }

  public isTableStarted(tableId: string): boolean {
    return this.startedTables.has(tableId);
  }
}
