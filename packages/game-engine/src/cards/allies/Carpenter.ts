import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo } from '../../StandardCardEligibilityFunctions';
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class Carpenter extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Carpenter'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    if (ie.getNumEmptySupplyPiles() === 0) {
      ie.addActions(1);
      const gainChoice = await ie
        .chooseCard('Gain a card costing up to $4')
        .from(CardSelectionLocation.SUPPLY)
        .to(CardSelectionPurpose.GAIN)
        .whereCardIs(costsUpTo(Cost.Simple(4)))
        .choose();
      if (gainChoice instanceof Card) {
        await ie.gainCardFromPile(gainChoice);
      }
      return;
    }

    const trashedCards = await ie
      .chooseCards('Trash a card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereNumCardsIs(exactlyNChecked(1))
      .choose();
    if (trashedCards.isEmpty()) {
      return;
    }

    const trashed = trashedCards.getArbitraryCard();
    await ie.trashCardFromLocation(trashed, CardLocation.HAND);

    const gainChoice = await ie
      .chooseCard('Gain a card costing up to $2 more than it')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsUpTo(Cost.Simple(trashed.getCost().coins + 2)))
      .choose();
    if (gainChoice instanceof Card) {
      await ie.gainCardFromPile(gainChoice);
    }
  }
}
