import { CardCollection } from '../card/CardCollection';
import { ArrayIterator } from '../Iterator';
import { Pile } from './Pile';
import { PileSortingFunction } from './PileSortingFunctions';

export class PileGroup implements Iterable<Pile> {
  protected _piles: Map<string, Pile>;

  constructor() {
    this._piles = new Map<string, Pile>();
  }

  public addPile(pile: Pile) {
    this._piles.set(pile.name, pile);
  }

  public hasPile(name: string): boolean {
    return this._piles.has(name);
  }

  public getPileByName(name: string): Pile | undefined {
    return this._piles.get(name);
  }

  public get pileNames(): string[] {
    return Array.from(this._piles.keys());
  }

  public get piles(): Pile[] {
    return Array.from(this._piles.values());
  }

  public getTopCards(): CardCollection {
    const topCards: CardCollection = new CardCollection();
    for (const pile of this.piles.values()) {
      if (pile.size() > 0) {
        topCards.addCard(pile.getTopCard()!);
      }
    }
    return topCards;
  }

  public get numEmptyPiles(): number {
    return Array.from(this.piles.values()).filter((pile) => pile.size() === 0).length;
  }

  [Symbol.iterator]() {
    return new ArrayIterator<Pile>(this.piles);
  }

  public sorted(sortingFunction: PileSortingFunction): Iterable<Pile> {
    const sortedCards: Pile[] = this.piles.sort(sortingFunction.order);
    return {
      [Symbol.iterator]: () => new ArrayIterator<Pile>(sortedCards),
    };
  }
}
