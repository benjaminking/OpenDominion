import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

// Secret Cave (Action/Duration): +1 Card, +1 Action.
// You may discard 3 cards. If you did, at the start of your next turn, +$3.
export class SecretCave extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Secret Cave'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    const cardsToDiscard: CardCollection = await ie
      .chooseCards('You may discard 3 cards for +$3 next turn')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereNumCardsIs(upToNChecked(3))
      .choose();
    if (cardsToDiscard.size() === 3) {
      await ie.discardCardsFromLocation(cardsToDiscard, CardLocation.HAND);
      ie.addEffect(
        new Effect.Builder()
          .from(this)
          .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
          .onTurn(ie.createNextTurnEligibilityFunction())
          .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
          .makeMandatory()
          .action(
            new EffectAction(async (effectIe: InstructionExecutor) => {
              await effectIe.addCoins(3);
              this.markAsFinished();
            }),
          )
          .build(),
      );
      this.markAsUnfinished();
    }
  }
}
