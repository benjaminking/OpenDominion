import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { anyNumber } from '../../StandardNumberEligibilityFunctions';

export class Storeroom extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Storeroom'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);

    // Discard any number, then draw that many
    const cardsToDiscard: CardCollection = await ie
      .chooseCards('Discard any number of cards, then draw that many')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereNumCardsIs(anyNumber)
      .choose();
    const numDiscarded = cardsToDiscard.size();
    await ie.discardCardsFromLocation(cardsToDiscard, CardLocation.HAND);
    if (numDiscarded > 0) {
      await ie.drawCards(numDiscarded);
    }

    // Discard any number for +$1 each
    const cardsToDiscardForCoins: CardCollection = await ie
      .chooseCards('Discard any number of cards for +$1 each')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereNumCardsIs(anyNumber)
      .choose();
    const numForCoins = cardsToDiscardForCoins.size();
    await ie.discardCardsFromLocation(cardsToDiscardForCoins, CardLocation.HAND);
    if (numForCoins > 0) {
      await ie.addCoins(numForCoins);
    }
  }
}
