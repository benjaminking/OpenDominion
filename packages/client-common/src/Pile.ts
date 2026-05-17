import { CardMetadata, CardType, Cost, PileMetadata } from '@dominion/common';

export class Pile {
  private types: Set<CardType> = new Set<CardType>();

  constructor(
    private readonly _name: string,
    private _size: number,
    private _cost: Cost,
    private topCard: CardMetadata | undefined,
    types: CardType[],
  ) {
    for (const type of types) {
      this.types.add(type);
    }
  }

  updateSize(newSize: number): void {
    this._size = newSize;
  }

  updateTopCard(card: CardMetadata | undefined) {
    this.topCard = card;
  }

  static createFrom(pileMetadata: PileMetadata): Pile {
    return new Pile(pileMetadata.name, pileMetadata.size, pileMetadata.cost, pileMetadata.topCard, pileMetadata.types);
  }

  public get cost(): Cost {
    return this._cost;
  }

  public get size(): number {
    return this._size;
  }

  public get name(): string {
    return this._name;
  }
}
