import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsExactly } from '../../StandardCardEligibilityFunctions';

export class Upgrade extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Upgrade'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);

    const cardToTrash: Card | Choice = await ie
      .chooseCard('Choose a card to trash')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .choose();

    if (!(cardToTrash instanceof Card)) {
      return;
    }

    const trashedCard: Card | undefined = await ie.trashCardFromLocation(cardToTrash, CardLocation.HAND);
    if (trashedCard === undefined) {
      return;
    }

    const cardToGain: Card | Choice = await ie
      .chooseCard('Choose a card costing exactly $' + trashedCard.getCost().plus(1).coins.toFixed() + ' to gain')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsExactly(trashedCard.getCost().plus(1)))
      .choose();

    if (cardToGain instanceof Card) {
      await ie.gainCardFromPile(cardToGain);
    }
  }
}
