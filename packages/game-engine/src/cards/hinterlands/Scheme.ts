import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { OnceThisTurnEffectExpiration } from '../../effects/StandardEffectExpirations';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { both, isActionCard } from '../../StandardCardEligibilityFunctions';

const cardWouldBeDiscarded = new CardEligibilityFunction((card: Card): boolean => {
  return card.canBeDiscardedInCleanup();
});

export class Scheme extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Scheme'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .onTurn(ie.createThisTurnEligibilityFunction())
        .triggerOn(EffectTriggerType.CLEANUP_START, EffectSource.SELF)
        .withExpiration(new OnceThisTurnEffectExpiration(ie.getSharedGameState().getCurrentTurn()))
        .action(
          new EffectAction(async (effectIe: InstructionExecutor) => {
            const actionToTopDeck = await effectIe
              .chooseCard('You may put one of your Action cards onto your deck')
              .from(CardLocation.IN_PLAY)
              .to(CardSelectionPurpose.TOPDECK)
              .whereCardIs(both(isActionCard, cardWouldBeDiscarded))
              .allowNoneOption()
              .choose();
            if (actionToTopDeck instanceof Card) {
              await effectIe.topDeckCardFromLocation(actionToTopDeck, CardLocation.IN_PLAY);
            }
          }),
        )
        .build(),
    );
  }
}
