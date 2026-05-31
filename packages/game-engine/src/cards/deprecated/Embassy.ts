import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

// Embassy (Action): +5 Cards. Discard 3 cards.
export class Embassy extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Embassy'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(5);
    const toDiscard = await ie
      .chooseCards('Discard 3 cards')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereNumCardsIs(exactlyNChecked(3))
      .choose();
    await ie.discardCards(toDiscard, CardLocation.HAND);
  }
}
