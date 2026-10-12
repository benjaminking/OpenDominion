import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { either, isCurseCard, isVictoryCard } from '../../StandardCardEligibilityFunctions';

export class Patrol extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Patrol'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(3);
    const topCards = await ie.takeCardsOffDeck(4);
    // Created once the cards are off the deck: taking them off sets their location twice, which counts as a move
    const locationExpectation = ie.createLocationExpectation(CardLocation.REVEAL_LIMBO);
    await ie.revealCards(topCards);

    // Reveal triggers may move revealed cards; those can't be put into hand or back onto the deck
    for (const card of [...topCards.asCardArray()]) {
      if (!locationExpectation.isMet(card)) {
        ie.sendLostTrackMessage(card);
        topCards.removeCard(card);
      }
    }

    const victoryAndCurses = topCards.getMatchingCards(either(isVictoryCard, isCurseCard));
    ie.putCardsIntoHandFromSet(victoryAndCurses, topCards);

    await ie.topDeckCardsFromRevealedSet(topCards);
  }
}
