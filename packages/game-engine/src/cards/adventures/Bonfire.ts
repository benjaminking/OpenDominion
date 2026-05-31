import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class Bonfire extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Bonfire'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    const cards = await ie
      .chooseCards('Choose up to 4 cards to trash')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereNumCardsIs(upToNChecked(2))
      .whereCardIs(cardNameIs('Copper'))
      .choose();
    await ie.trashCardsFromLocation(cards, CardLocation.HAND);
  }
}
