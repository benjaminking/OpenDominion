import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { Boon } from '../../card/Boon';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class TheWindsGift extends Boon {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo("The Wind's Gift"));
  }

  public async receive(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);
    const cardsToDiscard: CardCollection = await ie
      .chooseCards('Choose 2 cards to discard')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereNumCardsIs(exactlyNChecked(2))
      .choose();
    await ie.discardCardsFromLocation(cardsToDiscard, CardLocation.HAND);
  }
}
