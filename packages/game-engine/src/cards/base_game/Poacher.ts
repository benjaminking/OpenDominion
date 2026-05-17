import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class Poacher extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Poacher'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    await ie.addCoins(1);
    const numToDiscard = ie.getSharedGameState().piles.numEmptySupplyPiles;
    if (numToDiscard > 0) {
      const cards: CardCollection = await ie
        .chooseCards('Choose ' + numToDiscard.toFixed() + ' cards to discard')
        .from(CardLocation.HAND)
        .to(CardSelectionPurpose.DISCARD)
        .whereNumCardsIs(exactlyNChecked(numToDiscard))
        .choose();
      await ie.discardCardsFromLocation(cards, CardLocation.HAND);
    }
  }
}
