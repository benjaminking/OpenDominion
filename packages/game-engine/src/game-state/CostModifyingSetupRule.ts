import { CostModifier } from '../effects/CostModifier';
import { SetupRule } from './SetupRule';
import { SharedGameState } from './SharedGameState';

export class CostModifyingSetupRule extends SetupRule {
  constructor(private readonly costModifier: CostModifier) {
    super();
  }

  public applySetupRules(sharedGameState: SharedGameState): void {
    sharedGameState.addCostModifier(this.costModifier);
  }
}
