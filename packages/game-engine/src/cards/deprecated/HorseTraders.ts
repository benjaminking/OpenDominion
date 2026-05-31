import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

// Horse Traders (Action/Reaction): +1 Buy, +$3. Discard 2 cards.
// (Reaction mechanic: may set aside when attacked, return next turn for +1 Card — not implemented)
export class HorseTraders extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Horse Traders'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);
    await ie.addCoins(3);
    const toDiscard = await ie
      .chooseCards('Discard 2 cards')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereNumCardsIs(exactlyNChecked(2))
      .choose();
    await ie.discardCards(toDiscard, CardLocation.HAND);
  }
}
