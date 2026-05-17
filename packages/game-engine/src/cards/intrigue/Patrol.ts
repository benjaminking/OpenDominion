import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { either, isCurseCard, isVictoryCard } from '../../StandardCardEligibilityFunctions';

export class Patrol extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Patrol'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(3);
    const topCards = await ie.takeCardsOffDeck(4);
    await ie.revealCards(topCards);

    const victoryAndCurses = topCards.getMatchingCards(either(isVictoryCard, isCurseCard));
    ie.putCardsIntoHandFromSet(victoryAndCurses, topCards);

    await ie.topDeckCardsFromRevealedSet(topCards);
  }
}
