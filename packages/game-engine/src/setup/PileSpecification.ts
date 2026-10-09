import { RandomizerRequirements } from '@dominion/common';

export class PileSpecification {
  public constructor(
    private readonly randomizerRequirements: RandomizerRequirements,
    private readonly isSupply = false,
    private readonly isKingdom = false,
  ) {}

  public getRandomizerRequirements(): RandomizerRequirements {
    return this.randomizerRequirements;
  }

  public isSupplyPile(): boolean {
    return this.isSupply;
  }

  public isKingdomPile(): boolean {
    return this.isKingdom;
  }
}
