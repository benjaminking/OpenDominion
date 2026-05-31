import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard } from '../../StandardCardEligibilityFunctions';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class Elder extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Elder'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addCoins(2);

    const choice = await ie
      .chooseCards('You may play an Action card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.PLAY)
      .whereCardIs(isActionCard)
      .whereNumCardsIs(upToNChecked(1))
      .choose();
    if (!choice.isEmpty()) {
      await ie.playCardFromHand(choice.getArbitraryCard());
    }

    ie.enableChooseExtraOptionThisTurn();
  }
}
