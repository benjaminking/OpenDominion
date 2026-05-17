import { CardLocation, CardMetadata, NumberType } from '@dominion/common';

import { OrderedCardCollection } from './OrderedCardCollection';
import { Statistics } from './Statistics';

// TODO: factor out what's common between this and MainPlayer into a superclass
export class OtherPlayer {
  private handSize = 0;
  private discardTopCard: CardMetadata | undefined = undefined;
  private deckSize = 0;
  private inPlay = new OrderedCardCollection();
  private setAside = new OrderedCardCollection();
  private limbo = new OrderedCardCollection();
  private islandMat = new OrderedCardCollection();
  private nativeVillageMatSize = 0;
  private _statistics: Statistics = new Statistics();

  constructor(private readonly _name: string) {}

  public get name(): string {
    return this._name;
  }

  public get statistics(): Statistics {
    return this._statistics;
  }

  updateStatistic(type: NumberType, value: number) {
    this.statistics.updateStatistic(type, value);
  }

  updateCards(location: CardLocation, cards: CardMetadata[]): void {
    switch (location) {
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
