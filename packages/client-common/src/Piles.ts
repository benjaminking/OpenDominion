import { CardMetadata, PileCategory, PileMetadata } from '@dominion/common';

import { Pile } from './Pile';

export class Piles {
  private _basicTreasurePiles: Pile[] = [];
  private _basicVictoryPiles: Pile[] = [];
  private _kingdomPiles: Pile[] = [];
  private _nonSupplyPiles: Pile[] = [];

  private pilesByName: Map<string, Pile> = new Map<string, Pile>();

  public get basicTreasurePiles(): Pile[] {
    return this._basicTreasurePiles;
  }

  public get basicVictoryPiles(): Pile[] {
    return this._basicVictoryPiles;
  }

  public get kingdomPiles(): Pile[] {
    return this._kingdomPiles;
  }

  public get nonSupplyPiles(): Pile[] {
    return this._nonSupplyPiles;
  }

  updatePile(pileMetadata: PileMetadata): void {
    if (!this.pilesByName.has(pileMetadata.name)) {
      this.addPile(pileMetadata);
    } else {
      this.updatePileSizeAndTopCard(pileMetadata.name, pileMetadata.size, pileMetadata.topCard);
    }
  }

  addPile(pileMetadata: PileMetadata): void {
    const pile: Pile = Pile.createFrom(pileMetadata);
    for (const category of pileMetadata.categories) {
      if (category === PileCategory.NON_SUPPLY) {
        this._nonSupplyPiles.push(pile);
      }
      if (category === PileCategory.KINGDOM) {
        this._kingdomPiles.push(pile);
      }
      if (category === PileCategory.BASIC_TREASURE) {
        this._basicTreasurePiles.push(pile);
      }
      if (category === PileCategory.BASIC_VICTORY) {
        this._basicVictoryPiles.push(pile);
      }
    }
    this.pilesByName.set(pile.name, pile);
  }

  getCountInPile(pileName: string): number {
    if (this.pilesByName.has(pileName)) {
      return this.pilesByName.get(pileName)!.size;
    }
    return 0;
  }

  updatePileSizeAndTopCard(pileName: string, cardCount: number, topCard: CardMetadata | undefined): void {
    this.pilesByName.get(pileName)?.updateSize(cardCount);
    this.pilesByName.get(pileName)?.updateTopCard(topCard);
  }
}
