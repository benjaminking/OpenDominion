import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo } from '../../StandardCardEligibilityFunctions';

// Zombie Mason (Action/Zombie): Trash the top card of your deck.
// You may gain a card costing up to 1 more than it.
export class ZombieMason extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Zombie Mason'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const trashedCard = await ie.trashTopCardOfDeck();
    if (trashedCard !== undefined) {
      const cardToGain: Card | Choice = await ie
        .chooseCard(`Gain a card costing up to $${trashedCard.getCost().plus(1).coins}`)
        .from(CardSelectionLocation.SUPPLY)
        .to(CardSelectionPurpose.GAIN)
        .whereCardIs(costsUpTo(trashedCard.getCost().plus(1)))
        .allowNoneOption()
        .choose();
      if (cardToGain instanceof Card) {
        await ie.gainCardFromPile(cardToGain.getPileName());
      }
    }
  }
}
