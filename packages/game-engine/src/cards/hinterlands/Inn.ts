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

    // With no cards in hand, there is nothing to choose
    if (ie.handSize() === 0) {
      return;
    }
    const cardsToDiscard: CardCollection = await ie
      .chooseCards('Choose 2 cards to discard')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereNumCardsIs(exactlyNChecked(Math.min(2, ie.handSize())))
      .choose();
    await ie.discardCardsFromLocation(cardsToDiscard, CardLocation.HAND);
  }

  private async onGain(ie: InstructionExecutor): Promise<void> {
    // With no Action cards in the discard pile there is nothing to choose, but the deck is still shuffled
    if (ie.getEligibleCardChoices(new Set([CardLocation.DISCARD]), isActionCard).length > 0) {
      const toShuffleIntoDeck = await ie
        .chooseCards('Reveal any number of Action cards from your discard pile to put onto your deck')
        .from(CardLocation.DISCARD)
        .whereCardIs(isActionCard)
        .to(CardSelectionPurpose.OTHER)
        .choose();
      const locationExpectation = ie.createLocationExpectation(CardLocation.DISCARD);

      await ie.revealCards(toShuffleIntoDeck);
      for (const card of toShuffleIntoDeck) {
        if (!locationExpectation.isMet(card)) {
          ie.sendLostTrackMessage(card);
        } else {
          await ie.topDeckCardFromLocation(card, CardLocation.DISCARD, true);
        }
      }
    }
    await ie.shuffleDeck();
  }
}
