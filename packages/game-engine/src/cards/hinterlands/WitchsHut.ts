import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { isActionCard } from '../../StandardCardEligibilityFunctions';
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class WitchsHut extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo("Witch's Hut"));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(4);
    // With no cards in hand, there is nothing to discard, so no Curses either
    if (ie.handSize() === 0) {
      return;
    }

    const cardsToDiscard: CardCollection = await ie
      .chooseCards('Choose 2 cards to discard')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereNumCardsIs(exactlyNChecked(Math.min(2, ie.handSize())))
      .choose();
    const locationExpectation = ie.createLocationExpectation(CardLocation.HAND);

    await ie.revealCards(cardsToDiscard);
    const cardsStillInHand = new CardCollection();
    for (const card of cardsToDiscard) {
      if (!locationExpectation.isMet(card)) {
        ie.sendLostTrackMessage(card);
      } else {
        cardsStillInHand.addCard(card);
      }
    }
    await ie.discardCardsFromLocation(cardsStillInHand, CardLocation.HAND);

    if (cardsToDiscard.size() === 2 && cardsToDiscard.numMatchingCards(isActionCard) === 2) {
      await ie.performAttack(this, this.attack.bind(this));
    }
  }

  private async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    await attackedPlayer.getInstructionExecutor().gainCardFromPile('Curse');
  }
}
