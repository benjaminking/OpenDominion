import { Expansion, Mechanic } from '@dominion/common';

import { Card } from '../card/Card';
import { KingdomCard } from '../card/KingdomCard';

export class Randomizers {
  public constructor(private readonly randomizers: KingdomCard[]) {}

  public hasCardUsingMechanic(mechanic: Mechanic) {
    return this.randomizers.find((card) => card.usesMechanic(mechanic)) !== undefined;
  }

  public getProportionFromExpansion(expansion: Expansion): number {
    if (this.randomizers.length === 0) {
      return 0;
    }
    return this.randomizers.filter((card) => card.isFromExpansion(expansion)).length / this.randomizers.length;
  }

  public getCards(): Card[] {
    return this.randomizers;
  }
}
