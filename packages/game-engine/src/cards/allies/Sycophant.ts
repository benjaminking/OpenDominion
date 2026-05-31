import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class Sycophant extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sycophant'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);

    const discarded = await ie
      .chooseCards('Discard up to 3 cards')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereNumCardsIs(upToNChecked(3))
      .choose();

    if (!discarded.isEmpty()) {
      await ie.discardCardsFromLocation(discarded, CardLocation.HAND);
      ie.addCoins(3);
    }
  }
}
