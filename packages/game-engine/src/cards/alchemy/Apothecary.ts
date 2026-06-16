import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { cardNameIs, either } from '../../StandardCardEligibilityFunctions';

export class Apothecary extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Apothecary'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);

    const topCards = await ie.takeCardsOffDeck(4);
    await ie.revealCards(topCards);

    const cardsToHand = topCards.getMatchingCards(either(cardNameIs('Copper'), cardNameIs('Potion')));
    ie.putCardsIntoHandFromSet(cardsToHand, topCards);

    if (topCards.size() > 0) {
      await ie.topDeckCardsFromRevealedSet(topCards);
    }
  }
}
