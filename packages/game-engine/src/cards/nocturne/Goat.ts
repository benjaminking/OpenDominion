import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { anyCard } from '../../StandardCardEligibilityFunctions';

// Goat (Treasure/Heirloom): $1. When you play this, you may trash a card from your hand.
export class Goat extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Goat'));
    this.setCoins(1);
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(1);
    const cardToTrash: Card | Choice = await ie
      .chooseCard('You may trash a card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereCardIs(anyCard)
      .allowNoneOption()
      .choose();
    if (cardToTrash instanceof Card) {
      await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
    }
  }
}
