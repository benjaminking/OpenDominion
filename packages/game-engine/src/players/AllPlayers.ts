import { Client } from '@dominion/client-common';

import { Game } from '../Game';
import { ArrayIterator } from '../Iterator';
import { Player } from './Player';

export class AllPlayers implements Iterable<Player> {
  public constructor(
    private allPlayers: Player[],
    private readonly game: Game,
  ) {}

  public communicateInitialState(): void {
    for (const player of this.allPlayers) {
      player.communicateInitialState();
    }
  }

  public randomizeOrder(): void {
    const order: Player[] = [];
    for (const player of this.allPlayers) {
      order.push(player);
    }
    order.sort(() => 0.5 - Math.random());

    this.allPlayers = order;
  }

  public numTotalPlayers(): number {
    return this.allPlayers.length;
  }

  public getPlayerByName(playerName: string): Player | undefined {
    for (const otherPlayer of this.allPlayers) {
      if (playerName === otherPlayer.getName()) {
        return otherPlayer;
      }
    }
  }

  public getPlayerAtIndex(playerIndex: number): Player {
    return this.allPlayers[playerIndex];
  }

  public getPlayerIndexByName(playerName: string): number {
    return this.allPlayers.findIndex((player: Player) => player.getName() === playerName);
  }

  public getOpponentsOfPlayerByName(playerName: string): Player[] {
    return this.allPlayers.filter((x) => x.getName() !== playerName);
  }

  public getAllPlayers(): Player[] {
    return this.allPlayers;
  }

  [Symbol.iterator]() {
    return new ArrayIterator<Player>(this.allPlayers);
  }

  public getHighestScore(): number {
    let highestScore = -1000000;
    for (const player of this.allPlayers) {
      if (player.getStatistics().getScore() > highestScore) {
        highestScore = player.getStatistics().getScore();
      }
    }
    return highestScore;
  }

  public getWinningPlayer(): Player {
    const highestScore: number = this.getHighestScore();
    for (const player of this.allPlayers) {
      if (player.getStatistics().getScore() === highestScore) {
        return player;
      }
    }
    // TODO: consider ties and the player who's taken the fewest turns
    return this.allPlayers[0];
  }

  public getClients(): Client[] {
    return this.allPlayers.map((player: Player) => player.getClient());
  }
}
