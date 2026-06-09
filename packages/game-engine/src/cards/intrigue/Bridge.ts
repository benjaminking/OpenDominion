import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { CostModifier } from '../../effects/CostModifier';
import { CoinCostReduction } from '../../effects/StandardCostChangeFunctions';
import { ThisTurnEligibility } from '../../effects/StandardTurnEligibilityFunctions';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Bridge extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Bridge'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);
    await ie.addCoins(1);
    this.sharedGameState.addCostModifier(
      new CostModifier.Builder()
        .setTurnEligibility(new ThisTurnEligibility(this.sharedGameState))
        .setCostChangeFunction(new CoinCostReduction(1))
        .build(),
    );
  }
}
