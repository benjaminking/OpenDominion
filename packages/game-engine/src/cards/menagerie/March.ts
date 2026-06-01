import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard } from '../../StandardCardEligibilityFunctions';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class March extends Event {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('March'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    const choice = await ie
      .chooseCards('You may play an Action card from your discard pile')
      .from(CardLocation.DISCARD)
      .to(CardSelectionPurpose.PLAY)
      .whereCardIs(isActionCard)
      .whereNumCardsIs(upToNChecked(1))
      .choose();

    if (!choice.isEmpty()) {
      await ie.playCardFromLocation(choice.getArbitraryCard(), CardLocation.DISCARD);
    }
  }
}
