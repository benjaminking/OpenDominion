import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo } from '../../StandardCardEligibilityFunctions';

export class Stonemason extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Stonemason'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    // TODO: overpay effect - gain 2 Action cards costing exactly the overpaid amount (not yet triggered by buy)

    const cardToTrash: Card | Choice = await ie
      .chooseCard('Trash a card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .allowNoneOption()
      .choose();
    if (!(cardToTrash instanceof Card)) {
      return;
    }
    const trashedCost = cardToTrash.getCost();
    await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);

    // Gain 2 cards each costing less than it
    for (let i = 0; i < 2; i++) {
      const card: Card | Choice = await ie
        .chooseCard('Gain a card costing less than $' + trashedCost.coins.toFixed())
        .from(CardSelectionLocation.SUPPLY)
        .to(CardSelectionPurpose.GAIN)
        .whereCardIs(costsUpTo(trashedCost.plus(-1)))
        .allowNoneOption()
        .choose();
      if (card instanceof Card) {
        await ie.gainCardFromPile(card);
      }
    }
  }
}
