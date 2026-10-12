import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Boon } from '../../card/Boon';
import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { costsUpTo, isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class TheEarthsGift extends Boon {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo("The Earth's Gift"));
  }

  public async receive(ie: InstructionExecutor): Promise<void> {
    const cardToDiscard: Card | Choice = await ie
      .chooseCard('You may discard a Treasure to gain a card costing up to $4')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereCardIs(isTreasureCard)
      .allowNoneOption()
      .choose();
    if (!(cardToDiscard instanceof Card)) {
      return;
    }
    await ie.discardCardFromLocation(cardToDiscard, CardLocation.HAND);
    const cardToGain: Card | Choice = await ie
      .chooseCard('Choose a card costing up to $4 to gain')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsUpTo(Cost.Simple(4)))
      .allowNoneOption()
      .choose();
    if (cardToGain instanceof Card) {
      await ie.gainCardFromPile(cardToGain);
    }
  }
}
