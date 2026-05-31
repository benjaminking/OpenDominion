import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isVictoryCard } from '../../StandardCardEligibilityFunctions';

// Scout (Action): +1 Action. Reveal the top 4 cards of your deck.
// Put the Victory cards and Curses into your hand. Put the rest back in any order.
export class Scout extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Scout'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    const topCards = await ie.takeCardsOffDeck(4);
    await ie.revealCards(topCards);
    const victories = topCards.getMatchingCards(isVictoryCard);
    const rest = topCards.getMatchingCards(new CardEligibilityFunction((c) => !isVictoryCard.matches(c)));
    for (const card of victories) {
      ie.putCardIntoHandFromLocation(card, CardLocation.REVEAL_LIMBO);
    }
    await ie.topDeckCardsFromRevealedSet(rest);
  }
}
