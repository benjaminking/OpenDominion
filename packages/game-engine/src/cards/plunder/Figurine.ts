import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

export class Figurine extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Figurine'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);

    const cardToDiscard: Card | Choice = await ie
      .chooseCard('You may discard an Action card for +1 Buy and +$1')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereCardIs(isActionCard)
      .allowNoneOption()
      .choose();

    if (cardToDiscard instanceof Card) {
      await ie.discardCardFromLocation(cardToDiscard, CardLocation.HAND);
      ie.addBuys(1);
      await ie.addCoins(1);
    }
  }
}
