import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { either, isActionCard, isTreasureCard } from '../../StandardCardEligibilityFunctions';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class Courier extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Courier'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addCoins(1);

    const top = await ie.takeCardOffDeck();
    if (top !== undefined) {
      await ie.discardCard(top);
    }

    const choice = await ie
      .chooseCards('You may play an Action or Treasure from your discard pile')
      .from(CardLocation.DISCARD)
      .to(CardSelectionPurpose.PLAY)
      .whereCardIs(either(isActionCard, isTreasureCard))
      .whereNumCardsIs(upToNChecked(1))
      .choose();
    if (!choice.isEmpty()) {
      await ie.playCardFromLocation(choice.getArbitraryCard(), CardLocation.DISCARD);
    }
  }
}
