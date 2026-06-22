import { CostModifier } from '../effects/CostModifier';
import { SharedGameState } from '../game-state/SharedGameState';
import { GameStateSetupRule, SetupRuleType } from './SetupRule';

export class CostModifyingSetupRule implements GameStateSetupRule {
  constructor(private readonly costModifier: CostModifier) { }

  public setupRuleType: SetupRuleType.GAME_STATE = SetupRuleType.GAME_STATE;

  public applySetupRule(sharedGameState: SharedGameState): void {
    sharedGameState.addCostModifier(this.costModifier);
  }
}
