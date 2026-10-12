import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Boon } from '../../card/Boon';
import { CardCollection } from '../../card/CardCollection';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
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
