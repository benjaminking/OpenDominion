import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { CostModifier } from '../../effects/CostModifier';
import { CoinCostReduction } from '../../effects/StandardCostChangeFunctions';
import { ThisTurnEligibility } from '../../effects/StandardTurnEligibilityFunctions';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Princess (Action/Reward, non-supply): +1 Buy. Cards cost $2 less this turn.
export class Princess extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Princess'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);
    this.sharedGameState.addCostModifier(
      new CostModifier.Builder()
        .setTurnEligibility(new ThisTurnEligibility(this.sharedGameState))
        .setCostChangeFunction(new CoinCostReduction(2))
        .build(),
    );
  }
}
