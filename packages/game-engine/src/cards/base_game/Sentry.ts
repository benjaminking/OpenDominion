import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { LocationExpectation } from '../../game-state/LocationExpectation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Sentry extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sentry'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    const topCards = await ie.takeCardsOffDeck(2);
    // Trashing and discarding fire triggers before the rest of the cards are moved
    const locationExpectation = ie.createLocationExpectation(CardLocation.REVEAL_LIMBO);

    if (topCards.size() > 0) {
      const cardsToTrash: CardCollection = await ie
        .chooseCards('Choose any number of cards to trash')
        .from(topCards)
        .to(CardSelectionPurpose.TRASH)
        .choose();
      await ie.trashCardsFromSet(cardsToTrash, topCards);
    }

    this.dropLostTrackCards(ie, topCards, locationExpectation);
    if (topCards.size() > 0) {
      const cardsToDiscard: CardCollection = await ie
        .chooseCards('Choose any number of cards to discard')
        .from(topCards)
        .to(CardSelectionPurpose.DISCARD)
        .choose();
      await ie.discardCardsFromRevealedSet(cardsToDiscard, topCards);
      this.dropLostTrackCards(ie, topCards, locationExpectation);
      if (topCards.size() > 0) {
        await ie.topDeckCardsFromRevealedSet(topCards);
      }
    }
  }

  private dropLostTrackCards(
    ie: InstructionExecutor,
    topCards: CardCollection,
    locationExpectation: LocationExpectation,
  ): void {
    for (const card of CardCollection.fromCards(topCards.asCardArray())) {
      if (!locationExpectation.isMet(card)) {
        ie.sendLostTrackMessage(card);
        topCards.removeCard(card);
      }
    }
  }
}
