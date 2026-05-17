import { Cost } from '../card/Cost';

export abstract class CostChangeFunction {
  protected internalFunction: (currentCost: Cost) => Cost;

  public constructor(internalFunction: (currentCost: Cost) => Cost) {
    this.internalFunction = internalFunction;
  }

  public apply(currentCost: Cost): Cost {
    return this.internalFunction(currentCost);
  }
}
