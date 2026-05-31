import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard, not } from '../../StandardCardEligibilityFunctions';

export class WanderingMinstrel extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Wandering Minstrel'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(2);

    const topCards = await ie.takeCardsOffDeck(3);
    await ie.revealCards(topCards);

    const nonActions: CardCollection = topCards.getMatchingCards(not(isActionCard));
    await ie.discardCardsFromRevealedSet(nonActions, topCards);

    // Put Action cards back in any order chosen by the player
    await ie.topDeckCardsFromRevealedSet(topCards);
  }
}
