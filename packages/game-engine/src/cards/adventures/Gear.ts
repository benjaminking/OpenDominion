import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { Effect } from '../../effects/Effect';
import { EffectAction } from '../../effects/EffectAction';
import { EffectSource } from '../../effects/EffectSource';
import { EffectTriggerType } from '../../effects/EffectTriggerType';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class Gear extends KingdomCard {
  private setAsideCards: CardCollection = CardCollection.emptyCollection();

  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Gear'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);
    const cardsToSetAside: CardCollection = await ie
      .chooseCards('Set aside up to 2 cards')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.OTHER)
      .whereNumCardsIs(upToNChecked(2))
      .choose();

    for (const card of cardsToSetAside.asCardArray()) {
      await ie.setCardAsideFromLocation(card, CardLocation.HAND);
    }
    this.setAsideCards = cardsToSetAside;

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction((ie: InstructionExecutor) => {
            for (const card of this.setAsideCards.asCardArray()) {
              ie.putCardIntoHandFromLocation(card, CardLocation.SET_ASIDE);
            }
            this.setAsideCards = CardCollection.emptyCollection();
            this.markAsFinished();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
  }
}
