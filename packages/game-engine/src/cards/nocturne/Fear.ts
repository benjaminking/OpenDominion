import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Hex } from '../../card/Hex';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { either, isActionCard, isTreasureCard } from '../../StandardCardEligibilityFunctions';

// Fear: If you have at least 5 cards in hand, discard an Action or Treasure (or reveal you can't).
export class Fear extends Hex {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Fear'));
  }

  public async receive(ie: InstructionExecutor): Promise<void> {
    if (ie.handSize() < 5) {
      return;
    }
    const cardToDiscard: Card | Choice = await ie
      .chooseCard('Discard an Action or Treasure (or reveal you have none)')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereCardIs(either(isActionCard, isTreasureCard))
      .allowNoneOption()
      .choose();
    if (cardToDiscard instanceof Card) {
      await ie.discardCardFromLocation(cardToDiscard, CardLocation.HAND);
    }
  }
}
