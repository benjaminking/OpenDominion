import type { CardMetadata } from '@dominion/common';

export class OrderedCardCollection {
  private cards: CardMetadata[] = [];

  public replaceCards(newCards: CardMetadata[]): void {
    this.cards = newCards;
  }
}
