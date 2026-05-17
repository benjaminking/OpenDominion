import { CardLocation, CardMetadata, NumberType } from '@dominion/common';

import { GroupedCardCollection } from './GroupedCardCollection';
import { OrderedCardCollection } from './OrderedCardCollection';
import { Statistics } from './Statistics';

export class MainPlayer {
  private _hand = new GroupedCardCollection();
  private inPlay = new OrderedCardCollection();
  private deckSize = 0;
  private discardTopCard: CardMetadata | undefined = undefined;
  private setAside = new OrderedCardCollection();
  private limbo = new OrderedCardCollection();
  private islandMat = new OrderedCardCollection();
  private nativeVillageMatSize = 0;
  private _statistics: Statistics = new Statistics();

  public get hand(): GroupedCardCollection {
    return this._hand;
  }

  public get statistics(): Statistics {
    return this._statistics;
  }

  constructor(private readonly name: string) {}

  public getPlayerName(): string {
    return this.name;
  }

  updateStatistic(type: NumberType, value: number) {
    this._statistics.updateStatistic(type, value);
  }

  updateCards(location: CardLocation, cards: CardMetadata[]): void {
    switch (location) {
      case CardLocation.HAND: {
        this._hand.replaceCards(cards);
        break;
      }
      case CardLocation.IN_PLAY: {
        this.inPlay.replaceCards(cards);
        break;
      }
      case CardLocation.ISLAND_MAT: {
        this.islandMat.replaceCards(cards);
        break;
      }
      case CardLocation.REVEAL_LIMBO: {
        this.limbo.replaceCards(cards);
        break;
      }
      case CardLocation.SET_ASIDE: {
        this.setAside.replaceCards(cards);
        break;
      }
    }
  }

  updateCardCount(location: CardLocation, count: number): void {
    switch (location) {
      case CardLocation.DECK: {
        this.deckSize = count;
        break;
      }
      case CardLocation.NATIVE_VILLAGE_MAT: {
        this.nativeVillageMatSize = count;
        break;
      }
    }
  }

  updateTopCard(location: CardLocation, topCard: CardMetadata | undefined): void {
    switch (location) {
      case CardLocation.DISCARD: {
        this.discardTopCard = topCard;
        break;
      }
    }
  }
}
