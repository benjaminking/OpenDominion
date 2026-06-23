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
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class Grotto extends KingdomCard {
  private readonly setAsideCards = new CardCollection();

  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Grotto'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);

    const cardsToSetAside = await ie
      .chooseCards('Choose up to 4 cards to set aside')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.OTHER)
      .whereNumCardsIs(upToNChecked(4))
      .choose();
    for (const card of cardsToSetAside) {
      await ie.setCardAsideFromLocation(card, CardLocation.HAND);
      this.setAsideCards.addCard(card);
    }

    ie.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.TURN_START, EffectSource.SELF)
        .onTurn(ie.createNextTurnEligibilityFunction())
        .withExpiration(ie.createEndOfMyNextTurnEffectExpiration())
        .makeMandatory()
        .action(
          new EffectAction(async (effectIe: InstructionExecutor) => {
            const numCards = this.setAsideCards.size();
            await effectIe.discardCardsFromLocation(this.setAsideCards, CardLocation.SET_ASIDE);
            this.setAsideCards.clear();
            await effectIe.drawCards(numCards);
            this.markAsFinished();
          }),
        )
        .build(),
    );
    this.markAsUnfinished();
  }
}
