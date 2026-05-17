import { CardMetadata, CardType } from '@dominion/common';

import { Card } from './Card';

export class CardGroup {
  private cards: Card[];

  public constructor(cards: Card[]) {
    this.cards = cards;
  }

  public hasType(type: CardType): boolean {
    return this.cards[0].hasType(type);
  }

  public get name(): string {
    return this.cards[0].getName();
  }

  public get size(): number {
    return this.cards.length;
  }

  public get example(): Card {
    return this.cards[0];
  }

  public toCardMetadataArray(): CardMetadata[] {
    return this.cards.map((x) => x.getMetadata());
  }
}
