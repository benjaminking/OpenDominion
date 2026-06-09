import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class TidePools extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Tide Pools'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(3);
    ie.addActions(1);
    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (ie: InstructionExecutor) => {
            const cardsToDiscard: CardCollection = await ie
              .chooseCards('Choose 2 cards to discard')
              .from(CardLocation.HAND)
              .to(CardSelectionPurpose.DISCARD)
              .whereNumCardsIs(exactlyNChecked(2))
              .choose();
            await ie.discardCardsFromLocation(cardsToDiscard, CardLocation.HAND);
            this.markAsFinished();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
  }
}
