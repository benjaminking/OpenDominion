import {
  CardCount,
  CardLocation,
  CardMetadata,
  GameMessageTransmitter,
  NumberType,
  PileMetadata,
  StatusAction,
} from '@dominion/common';

import { Mechanic } from '../../common/dist/card/Mechanic.cjs';
import { BotStatistics } from './BotStatistics';
import { Piles } from './Piles';
import { Players } from './Players';
import { Trash } from './Trash';

// Only the details of the game state that need to be shown to the user
export class ClientGameState implements GameMessageTransmitter {
  private statusStack: string[] = [];
  private _piles: Piles = new Piles();
  private _trash: Trash = new Trash();
  private _players: Players = new Players();
  private _botStatistics: BotStatistics = new BotStatistics(0, [], []);

  public get players(): Players {
    return this._players;
  }

  public get piles(): Piles {
    return this._piles;
  }

  public get trash(): Trash {
    return this._trash;
  }

  public get botStatistics(): BotStatistics {
    return this._botStatistics;
  }

  public sendMainPlayerName(mainPlayerName: string): void {
    this._players.createMainPlayer(mainPlayerName);
  }

  public sendOpponentNames(opponentNames: string[]): void {
    for (const opponentName of opponentNames) {
      this._players.addOpponent(opponentName);
    }
  }

  public sendTurnStartMessage(currentPlayerName: string): void {
    this.players.startTurn(currentPlayerName);
  }

  public sendStatisticUpdate(ownerName: string, type: NumberType, value: number): void {
    this.players.updateStatistic(ownerName, type, value);
  }

  public sendCardsUpdate(ownerName: string, location: CardLocation, cards: CardMetadata[]): void {
    this.players.updateCards(ownerName, location, cards);
  }

  public sendCardCountUpdate(ownerName: string, location: CardLocation, cardCount: number): void {
    this.players.updateCardCount(ownerName, location, cardCount);
  }

  public sendTopCardUpdate(ownerName: string, location: CardLocation, topCard: CardMetadata | undefined): void {
    this.players.updateTopCard(ownerName, location, topCard);
  }

  public sendSharedCardsUpdate(location: CardLocation, cards: CardMetadata[]): void {
    switch (location) {
      case CardLocation.TRASH: {
        this.trash.replaceCards(cards);
        break;
      }
    }
  }

  public sendPileMetadata(pileMetadata: PileMetadata): void {
    this._piles.updatePile(pileMetadata);
    this._botStatistics.updatePileSize(pileMetadata.name, pileMetadata.size);
  }

  sendStatus(statusMessage: string, action: StatusAction): void {
    switch (action) {
      case StatusAction.REPLACE: {
        if (this.statusStack.length > 0) {
          this.statusStack[this.statusStack.length - 1] = statusMessage;
        } else {
          this.statusStack.push(statusMessage);
        }
        break;
      }
      case StatusAction.PUSH: {
        this.statusStack.push(statusMessage);
        break;
      }
      case StatusAction.POP: {
        if (this.statusStack.length > 0) {
          this.statusStack.pop();
        }
      }
    }
  }

  public sendBotCoins(numCoins: number): void {
    this._botStatistics.updateCoinsInDeck(numCoins);
  }

  public sendBotCardCounts(cardCountsObj: CardCount[]): void {
    this._botStatistics.updateDeckCounts(cardCountsObj);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public sendMechanics(_mechanics: Set<Mechanic>): void {}
}
