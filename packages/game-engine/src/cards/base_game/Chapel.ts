import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class Chapel extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Chapel'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cards = await ie
      .chooseCards('Choose up to 4 cards to trash')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereNumCardsIs(upToNChecked(4))
      .choose();
    await ie.trashCardsFromLocation(cards, CardLocation.HAND);
  }
}
