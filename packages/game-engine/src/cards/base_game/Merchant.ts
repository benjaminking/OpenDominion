import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

export class Merchant extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Merchant'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .triggerOn(EffectTriggerType.PLAYED_CARD, EffectSource.SELF)
        .whereCardIs(ie.createFirstMatchingCardPlayedThisTurnEligibilityFunction(cardNameIs('silver')))
        .withExpiration(ie.createOnceThisTurnEffectExpiration())
        .action(new EffectAction(() => this._playedFirstSilver(ie)))
        .makeMandatory()
        .build(),
    );
  }

  private async _playedFirstSilver(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(1);
  }
}
