import { CardInfoLookup } from '@dominion/card-info';

import { Project } from '../../card/Project';
import { CostModifier } from '../../effects/CostModifier';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { CoinCostReduction } from '../../effects/StandardCostChangeFunctions';
import { ThisTurnEligibility } from '../../effects/StandardTurnEligibilityFunctions';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Canal extends Project {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Canal'));

    // At the start of each of your turns, cards cost $1 less this turn.
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .makeMandatory()
        .action(
          new EffectAction((ie: InstructionExecutor) => {
            ie.getSharedGameState().addCostModifier(
              new CostModifier.Builder()
                .setTurnEligibility(new ThisTurnEligibility(ie.getSharedGameState()))
                .setCostChangeFunction(new CoinCostReduction(1))
                .build(),
            );
          }),
        )
        .build(),
    );
  }
}
