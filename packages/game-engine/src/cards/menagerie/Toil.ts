import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard } from '../../StandardCardEligibilityFunctions';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class Toil extends Event {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Toil'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);

    const cards = await ie
      .chooseCards('You may play an Action card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.PLAY)
      .whereCardIs(isActionCard)
      .whereNumCardsIs(upToNChecked(1))
      .choose();

    if (!cards.isEmpty()) {
      await ie.playCardFromHand(cards.getArbitraryCard());
    }
  }
}
