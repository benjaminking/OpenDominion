import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Merchant Guild: +1 Buy, +$1. At the end of your buy phase this turn,
// +1 Coffers per card you gained in your buy phase.
// Note: numCardsGainedInBuyPhase() is a stub returning 0.
export class MerchantGuild extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Merchant Guild'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);
    await ie.addCoins(1);

    // At end of buy phase this turn, +1 Coffers per card gained in buy phase
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.BUY_END, EffectSource.SELF)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .withExpiration(ie.createOnceThisTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction((ie: InstructionExecutor) => {
            // TODO: numCardsGainedInBuyPhase() stub returns 0
            ie.addCoffers(ie.numCardsGainedInBuyPhase());
          }),
        )
        .build(),
    );
  }
}
