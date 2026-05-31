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
import { isActionCard, isTheSameCardAs } from '../../StandardCardEligibilityFunctions';
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class Inn extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Inn'));
    this.addEffect(
      new Effect.Builder()
        .from(this)
        .triggerOn(EffectTriggerType.GAIN, EffectSource.SELF)
        .whereCardIs(isTheSameCardAs(this))
        .makeMandatory()
        .action(new EffectAction(this.onGain.bind(this)))
        .build(),
    );
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);
    ie.addActions(2);

    const cardsToDiscard: CardCollection = await ie
      .chooseCards('Choose 2 cards to discard')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereNumCardsIs(exactlyNChecked(2))
      .choose();
    await ie.discardCardsFromLocation(cardsToDiscard, CardLocation.HAND);
  }

  private async onGain(ie: InstructionExecutor): Promise<void> {
    const discardActionCards = ie.getCardsByMetadata(
      ie.getEligibleCardChoices(new Set([CardLocation.DISCARD]), isActionCard).map((choice) => choice.card),
    );
    const toShuffleIntoDeck = await ie
      .chooseCards('Reveal any number of Action cards from your discard pile to put onto your deck')
      .from(discardActionCards)
      .to(CardSelectionPurpose.OTHER)
      .choose();

    await ie.revealCards(toShuffleIntoDeck);
    for (const card of toShuffleIntoDeck) {
      await ie.topDeckCardFromLocation(card, CardLocation.DISCARD, true);
    }
  }
}
