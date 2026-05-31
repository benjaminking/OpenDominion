import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Night Watchman (Night): Look at the top 5 cards of your deck, discard any number,
// and put the rest back in any order.
export class NightWatchman extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Night Watchman'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const topCards = await ie.takeCardsOffDeck(5);
    if (topCards.size() === 0) {
      return;
    }
    const cardsToDiscard: CardCollection = await ie
      .chooseCards('Choose any number of cards to discard')
      .from(topCards)
      .to(CardSelectionPurpose.DISCARD)
      .choose();
    await ie.discardCardsFromRevealedSet(cardsToDiscard, topCards);
    await ie.topDeckCardsFromRevealedSet(topCards);
  }
}
