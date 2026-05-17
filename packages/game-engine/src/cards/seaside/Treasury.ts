import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isTheSameCardAs, isVictoryCard } from '../../StandardCardEligibilityFunctions';

export class Treasury extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Treasury'));
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.DISCARD, EffectSource.SELF)
        .whereCardIs(isTheSameCardAs(this))
        .addCondition(
          new EffectCondition((ie: InstructionExecutor) => {
            return !ie.hasGainedMatchingCardThisTurn(isVictoryCard);
          }),
        )
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            ie.putCardOnDeck(this);
            return Promise.resolve();
          }),
        )
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    await ie.addCoins(1);
  }
}
