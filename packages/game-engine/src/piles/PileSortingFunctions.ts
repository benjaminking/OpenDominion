import { Pile } from "./Pile";

export interface PileSortingFunction {
  order: (pileA: Pile, pileB: Pile) => number;
}

export class CostPileSortingFunction implements PileSortingFunction {
  public order(pileA: Pile, pileB: Pile): number {
    return (
      100 * (pileA.cost.coins - pileB.cost.coins) +
      10 * (pileA.cost.potions - pileB.cost.potions) +
      (pileA.cost.debt - pileB.cost.debt)
    );
  }
}
