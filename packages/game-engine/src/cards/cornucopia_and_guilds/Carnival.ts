import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { anyCard } from '../../StandardCardEligibilityFunctions';

export class Carnival extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Carnival'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const topCards: CardCollection = await ie.takeCardsOffDeck(4);
    const locationExpectation = ie.createLocationExpectation(CardLocation.REVEAL_LIMBO);
    await ie.revealCards(topCards);
    for (const card of topCards.asCardArray()) {
      if (!locationExpectation.isMet(card)) {
        ie.sendLostTrackMessage(card);
        topCards.removeCard(card);
      }
    }

    const uniqueCards = topCards.getMatchingCardsUnique(anyCard);
    ie.putCardsIntoHandFromSet(uniqueCards, topCards);
    await ie.discardCardsFromRevealedSet(topCards);
  }
}
