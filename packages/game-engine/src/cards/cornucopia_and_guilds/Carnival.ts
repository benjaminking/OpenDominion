import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
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
    await ie.revealCards(topCards);

    const uniqueCards = topCards.getMatchingCardsUnique(anyCard);
    ie.putCardsIntoHandFromSet(uniqueCards, topCards);
    await ie.discardCardsFromRevealedSet(topCards, topCards);
  }
}
