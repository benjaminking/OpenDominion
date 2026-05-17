import { Cost } from '../card/Cost';
import { CostChangeFunction } from './CostChangeFunction';

class NoCostChangeFunction extends CostChangeFunction {
  public constructor() {
    super((currentCost: Cost) => currentCost);
  }
}

const noCostChange: CostChangeFunction = new NoCostChangeFunction();

class CoinCostReduction extends CostChangeFunction {
  constructor(numCoins: number) {
    super((currentCost: Cost) => currentCost.plus(-numCoins));
  }
}

export { CoinCostReduction, noCostChange };
