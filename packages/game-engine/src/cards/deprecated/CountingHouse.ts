import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

// Counting House (Action): Look through your discard pile,
// reveal any number of Coppers from it, and put them into your hand.
export class CountingHouse extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Counting House'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const coppers = this.sharedGameState
      .getCurrentPlayer()
      .getOwnedCards()
      .getDiscard()
      .getMatchingCards(cardNameIs('Copper'));
    if (coppers.size() === 0) {
      return;
    }
    const toTake = await ie
      .chooseCards('Take any number of Coppers from your discard to hand')
      .from(coppers)
      .to(CardSelectionPurpose.OTHER)
      .whereNumCardsIs(upToNChecked(coppers.size()))
      .choose();
    for (const card of toTake) {
      ie.putCardIntoHandFromLocation(card, CardLocation.DISCARD);
    }
  }
}
