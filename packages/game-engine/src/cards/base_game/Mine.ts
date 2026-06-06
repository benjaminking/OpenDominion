import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { both, costsUpTo, isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class Mine extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Mine'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cardToTrashChoice: Card | Choice = await ie
      .chooseCard('Choose a card to trash')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereCardIs(isTreasureCard)
      .allowNoneOption()
      .choose();
    if (!(cardToTrashChoice instanceof Card)) {
      return;
    }
    const trashedCard: Card | undefined = await ie.trashCardFromLocation(cardToTrashChoice, CardLocation.HAND);
    if (trashedCard === undefined) {
      return;
    }

    const cardToGainChoice: Card | Choice = await ie
      .chooseCard('Choose a treasure card costing up to ' + trashedCard.getCost().plus(3).coins.toFixed() + ' to gain')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(both(isTreasureCard, costsUpTo(trashedCard.getCost().plus(3))))
      .choose();
    if (!(cardToGainChoice instanceof Card)) {
      return;
    }
    await ie.gainCardFromPile(cardToGainChoice, CardLocation.HAND);
  }
}
