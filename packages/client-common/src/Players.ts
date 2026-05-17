import { CardLocation, CardMetadata, NumberType } from '@dominion/common';

import { MainPlayer } from './MainPlayer';
import { OtherPlayer } from './OtherPlayer';

export class Players {
  private _mainPlayer: MainPlayer | undefined = undefined;
  private _otherPlayers: OtherPlayer[] = [];
  private otherPlayersByName: Map<string, OtherPlayer> = new Map<string, OtherPlayer>();
  private currentPlayerName = '';

  public get mainPlayer(): MainPlayer | undefined {
    return this._mainPlayer;
  }

  public get otherPlayers(): OtherPlayer[] {
    return this._otherPlayers;
  }

  createMainPlayer(mainPlayerName: string): void {
    this._mainPlayer = new MainPlayer(mainPlayerName);
  }

  addOpponent(opponentName: string): void {
    const opponent: OtherPlayer = new OtherPlayer(opponentName);
    this.otherPlayers.push(opponent);
    this.otherPlayersByName.set(opponent.name, opponent);
  }

  startTurn(currentPlayerName: string): void {
    this.currentPlayerName = currentPlayerName;
  }

  updateStatistic(ownerName: string, type: NumberType, value: number): void {
    if (ownerName === this._mainPlayer?.getPlayerName()) {
      this._mainPlayer.updateStatistic(type, value);
    } else {
      this.otherPlayersByName.get(ownerName)?.updateStatistic(type, value);
    }
  }

  updateCards(ownerName: string, location: CardLocation, cards: CardMetadata[]): void {
    if (ownerName === this._mainPlayer?.getPlayerName()) {
      this._mainPlayer.updateCards(location, cards);
    } else {
      this.otherPlayersByName.get(ownerName)?.updateCards(location, cards);
    }
  }

  updateCardCount(ownerName: string, location: CardLocation, cardCount: number): void {
    if (ownerName === this._mainPlayer?.getPlayerName()) {
      this._mainPlayer.updateCardCount(location, cardCount);
    } else {
      this.otherPlayersByName.get(ownerName)?.updateCardCount(location, cardCount);
    }
  }

  updateTopCard(ownerName: string, location: CardLocation, topCard: CardMetadata | undefined): void {
    if (ownerName === this._mainPlayer?.getPlayerName()) {
      this._mainPlayer.updateTopCard(location, topCard);
    } else {
      this.otherPlayersByName.get(ownerName)?.updateTopCard(location, topCard);
    }
  }
}
