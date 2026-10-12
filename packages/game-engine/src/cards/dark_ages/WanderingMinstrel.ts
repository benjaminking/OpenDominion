import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isActionCard, not } from '../../StandardCardEligibilityFunctions';

export class WanderingMinstrel extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Wandering Minstrel'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(2);

    const topCards = await ie.takeCardsOffDeck(3);
    const locationExpectation = ie.createLocationExpectation(CardLocation.REVEAL_LIMBO);
    await ie.revealCards(topCards);

    // Reveal triggers may have happened since the cards were revealed
    const lostCards = topCards.getMatchingCards(
      new CardEligibilityFunction((card: Card) => !locationExpectation.isMet(card)),
    );
    for (const lostCard of lostCards) {
      ie.sendLostTrackMessage(lostCard);
    }
    topCards.removeCards(lostCards);

    const actions: CardCollection = topCards.getMatchingCards(isActionCard);
    const nonActions: CardCollection = topCards.getMatchingCards(not(isActionCard));

    await ie.topDeckCardsFromRevealedSet(actions);
    await ie.discardCardsFromRevealedSet(nonActions);
  }
}
