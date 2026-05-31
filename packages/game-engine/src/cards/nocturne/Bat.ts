import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { anyCard } from '../../StandardCardEligibilityFunctions';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

// Bat (Night/Spirit): Trash up to 2 cards from your hand. If you did, exchange this for a Vampire.
export class Bat extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Bat'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cardsToTrash = await ie
      .chooseCards('Trash up to 2 cards from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereCardIs(anyCard)
      .whereNumCardsIs(upToNChecked(2))
      .choose();
    for (const card of cardsToTrash) {
      await ie.trashCardFromLocation(card, CardLocation.HAND);
    }
    if (cardsToTrash.size() > 0) {
      await ie.exchangeCard(this, 'Vampire');
    }
  }
}
