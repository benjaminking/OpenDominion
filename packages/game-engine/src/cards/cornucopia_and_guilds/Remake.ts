import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { anyCard, costsExactly } from '../../StandardCardEligibilityFunctions';

// Remake: Do this twice: Trash a card from your hand, then gain a card
// costing exactly $1 more than it.
export class Remake extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Remake'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    for (let i = 0; i < 2; i++) {
      const cardToTrash: Card | Choice = await ie
        .chooseCard('Trash a card from your hand')
        .from(CardLocation.HAND)
        .to(CardSelectionPurpose.TRASH)
        .whereCardIs(anyCard)
        .allowNoneOption()
        .choose();
      if (!(cardToTrash instanceof Card)) {
        continue;
      }
      const trashedCost = cardToTrash.getCost();
      await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);

      const cardToGain: Card | Choice = await ie
        .chooseCard('Gain a card costing exactly $' + trashedCost.plus(1).coins.toFixed())
        .from(CardSelectionLocation.SUPPLY)
        .to(CardSelectionPurpose.GAIN)
        .whereCardIs(costsExactly(trashedCost.plus(1)))
        .allowNoneOption()
        .choose();
      if (cardToGain instanceof Card) {
        await ie.gainCardFromPile(cardToGain);
      }
    }
  }
}
