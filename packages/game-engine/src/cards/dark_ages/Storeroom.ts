import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Storeroom extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Storeroom'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);

    // Discard any number, then draw that many
    const cardsToDiscardForCards: CardCollection = await ie
      .chooseCards('Discard any number of cards, then draw that many')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .choose();
    const discardedCardsForCards = await ie.discardCardsFromLocation(cardsToDiscardForCards, CardLocation.HAND);
    await ie.drawCards(discardedCardsForCards.size());

    // Discard any number for +$1 each
    const cardsToDiscardForCoins: CardCollection = await ie
      .chooseCards('Discard any number of cards for +$1 each')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .choose();
    const discardedCardsForCoins = await ie.discardCardsFromLocation(cardsToDiscardForCoins, CardLocation.HAND);
    await ie.addCoins(discardedCardsForCoins.size());
  }
}
