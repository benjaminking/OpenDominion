import { CardInfoLookup } from '@dominion/card-info';

import { Project } from '../../card/Project';
import { CostModifier } from '../../effects/CostModifier';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { CoinCostReduction } from '../../effects/StandardCostChangeFunctions';
import { ThisTurnEligibility } from '../../effects/StandardTurnEligibilityFunctions';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Canal extends Project {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Canal'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // At the start of each of your turns, cards cost $1 less this turn.
    ie.addEffect(
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
