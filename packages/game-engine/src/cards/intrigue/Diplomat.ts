import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectCondition } from '../../effects/EffectCondition';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isInLocation } from '../../StandardCardEligibilityFunctions';
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class Diplomat extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Diplomat'));
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.ATTACK, EffectSource.OTHER_PLAYER)
        .whereCardIs(isInLocation(CardLocation.HAND))
        .addCondition(
          new EffectCondition((ie: InstructionExecutor) => {
            return ie.handSize() >= 5;
          }),
        )
        .action(new EffectAction(this.reaction.bind(this)))
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);
    if (ie.handSize() >= 5) {
      ie.addActions(2);
    }
  }

  private async reaction(ie: InstructionExecutor, _attackCard: Card): Promise<void> {
    await ie.revealCard(this);
    await ie.drawCards(2);
    const cardsToDiscard = await ie
      .chooseCards('Choose three cards to discard')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereNumCardsIs(exactlyNChecked(3))
      .choose();
    await ie.discardCards(cardsToDiscard, CardLocation.HAND);
  }
}
