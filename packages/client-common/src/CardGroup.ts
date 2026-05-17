import { CardMetadata, CardType } from '@dominion/common';

export class CardGroup {
  public constructor(private readonly _cards: CardMetadata[]) {}

  public get exemplar(): CardMetadata {
    return this._cards[0];
  }

  public hasType(type: CardType): boolean {
    return this._cards[0].types.includes(type);
  }

  public get name(): string {
    return this._cards[0].name;
  }

  public get numCards(): number {
    return this._cards.length;
  }

  public get cards(): CardMetadata[] {
    return this._cards;
  }
}
