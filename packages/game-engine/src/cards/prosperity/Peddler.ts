import { CardInfoLookup } from '@dominion/card-info';

import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CostChangeFunction } from '../../effects/CostChangeFunction';
import { CostChangeTrigger } from '../../effects/CostChangeTrigger';
import { CostModifier } from '../../effects/CostModifier';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { AnyTurnEligibility } from '../../effects/StandardTurnEligibilityFunctions';
import { BuyPhaseEligibility } from '../../effects/StandardTurnPhaseEligibilityFunctions';
import { CostModifyingSetupRule } from '../../game-state/CostModifyingSetupRule';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { cardNameIs, isActionCard } from '../../StandardCardEligibilityFunctions';

export class Peddler extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Peddler'));
    sharedGameState.addSetupRule(
      this.getName(),
      new CostModifyingSetupRule(
        new CostModifier.Builder()
          .setCardEligibility(cardNameIs(this.getName()))
          .setTurnEligibility(new AnyTurnEligibility())
          .setTurnPhaseEligibility(new BuyPhaseEligibility())
          .recalculateCostsOn(
            new CostChangeTrigger.Builder().triggerOn(EffectTriggerType.PLAYED_CARD).whereCardIs(isActionCard).build(),
          )
          .recalculateCostsOn(new CostChangeTrigger.Builder().triggerOn(EffectTriggerType.BUY_START).build())
          .setCostChangeFunction(
            new CostChangeFunction((originalCost: Cost) => {
              const numActionsInPlay = sharedGameState
                .getCurrentPlayer()
                .getOwnedCards()
                .numMatchingCardsInPlay(isActionCard);
              return originalCost.minus(numActionsInPlay * 2);
            }),
          )
          .build(),
      ),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    await ie.addCoins(1);
  }
}
