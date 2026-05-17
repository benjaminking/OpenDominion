import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class Warehouse extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Warehouse'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(3);
    ie.addActions(1);
    const cardsToDiscard: CardCollection = await ie
      .chooseCards('Choose 3 cards to discard')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereNumCardsIs(exactlyNChecked(3))
      .choose();
    await ie.discardCardsFromLocation(cardsToDiscard, CardLocation.HAND);
  }
}
