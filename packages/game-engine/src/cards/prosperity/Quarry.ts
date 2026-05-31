import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { CostModifier } from '../../effects/CostModifier';
import { CoinCostReduction } from '../../effects/StandardCostChangeFunctions';
import { ThisTurnEligibility } from '../../effects/StandardTurnEligibilityFunctions';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

export class Quarry extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Quarry'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(1);
    this.sharedGameState.addCostModifier(
      new CostModifier.Builder()
        .setCardEligibility(isActionCard)
        .setTurnEligibility(new ThisTurnEligibility(this.sharedGameState))
        .setCostChangeFunction(new CoinCostReduction(2))
        .build(),
    );
  }
}
