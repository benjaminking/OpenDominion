import { CardCount, CardType } from '@dominion/common';

import { Card } from '../card/Card';
import { GameMessageBroadcaster } from '../messaging/GameMessageBroadcaster';
import { Player } from './Player';

// stats that we keep for the bot's sake
export class BotStatistics {
  private coinsInDeck = 0;
  private countInDeck: Map<string, number> = new Map<string, number>();
  private typeCountInDeck: Map<CardType, number> = new Map<CardType, number>();

  public constructor(
    private readonly player: Player,
    private readonly messageBroadcaster: GameMessageBroadcaster,
  ) {}

  public addCardToStatistics(card: Card): void {
    if (!this.countInDeck.has(card.getName())) {
      this.countInDeck.set(card.getName(), 0);
    }
    this.countInDeck.set(card.getName(), this.countInDeck.get(card.getName())! + 1);

    for (const type of card.getTypes()) {
      if (!this.typeCountInDeck.has(type)) {
        this.typeCountInDeck.set(type, 0);
      }
      this.typeCountInDeck.set(type, this.typeCountInDeck.get(type)! + 1);
    }

    this.coinsInDeck += card.getCoins();

    this.sendInformationToPlayerClient();
  }

  public removeCardFromStatistics(card: Card): void {
    if (!this.countInDeck.has(card.getName())) {
      return;
    }

    this.countInDeck.set(card.getName(), this.countInDeck.get(card.getName())! - 1);

    for (const type of card.getTypes()) {
      this.typeCountInDeck.set(type, this.typeCountInDeck.get(type)! - 1);
    }

    this.coinsInDeck -= card.getCoins();

    this.sendInformationToPlayerClient();
  }

  /*public getCoinsInDeck(): number {
    return this.coinsInDeck;
  }

  public getCountInDeck(cardName: string): number {
    if (this.countInDeck.has(cardName)) {
      return this.countInDeck.get(cardName);
    }
    return 0;
  }

  public getTypeCountInDeck(cardType: CardType): number {
    if (this.typeCountInDeck.has(cardType)) {
      return this.typeCountInDeck.get(cardType);
    }
    return 0;
  }*/

  private sendInformationToPlayerClient(): void {
    this.messageBroadcaster.updateBotCoins(this.coinsInDeck);

    const cardCountsObj: CardCount[] = this.convertDeckCountsToCardCounts();
    this.messageBroadcaster.updateBotCardCounts(cardCountsObj);
  }

  private convertDeckCountsToCardCounts(): CardCount[] {
    const cardCounts: CardCount[] = [];
    for (const [cardName, count] of this.countInDeck) {
      cardCounts.push({
        name: cardName,
        count: count,
      });
    }
    return cardCounts;
  }
}
