import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class Goatherd extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Goatherd'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    const cards = await ie
      .chooseCards('You may trash a card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereNumCardsIs(upToNChecked(1))
      .choose();

    if (!cards.isEmpty()) {
      await ie.trashCardsFromLocation(cards, CardLocation.HAND);
    }

    await ie.drawCards(ie.getNumCardsPlayerToRightTrashedOnLastTurn());
  }
}
