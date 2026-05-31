import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class HerbGatherer extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Herb Gatherer'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);
    await ie.moveDeckToDiscard();

    const choice = await ie
      .chooseCards('You may play a Treasure from your discard pile')
      .from(CardLocation.DISCARD)
      .to(CardSelectionPurpose.PLAY)
      .whereCardIs(isTreasureCard)
      .whereNumCardsIs(upToNChecked(1))
      .choose();
    if (!choice.isEmpty()) {
      await ie.playCardFromLocation(choice.getArbitraryCard(), CardLocation.DISCARD);
    }

    ie.rotatePileGroup('Augurs');
  }
}
