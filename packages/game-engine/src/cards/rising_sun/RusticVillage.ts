import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class RusticVillage extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Rustic Village'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);
    await ie.drawCards(1);
    ie.addActions(2);

    if (ie.handSize() < 2) {
      return;
    }

    const discardedCards: CardCollection = await ie
      .chooseCards('You may discard 2 cards for +1 Card')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereNumCardsIs(exactlyNChecked(2))
      .allowNoneOption()
      .choose();
    if (discardedCards.size() === 2) {
      await ie.discardCardsFromLocation(discardedCards, CardLocation.HAND);
      await ie.drawCards(1);
    }
  }
}
