import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardType } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectContext } from '../../effects/EffectContext';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { OneTimeEffectExpirtation } from '../../effects/StandardEffectExpirations';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

const nonCommandAction = new CardEligibilityFunction(
  (card) => card.hasType(CardType.ACTION) && !card.hasType(CardType.COMMAND),
);

export class Flagship extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Flagship'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.PLAYED_CARD, EffectSource.SELF)
        .whereCardIs(nonCommandAction)
        .withExpiration(new OneTimeEffectExpirtation())
        .makeMandatory()
        .action(
          new EffectAction(async (effectIe: InstructionExecutor, effectContext: EffectContext) => {
            const playedCard = effectContext.getTargetCard()!;
            await effectIe.playCardFromLocation(playedCard, CardLocation.IN_PLAY);
            this.markAsFinished();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
  }
}
