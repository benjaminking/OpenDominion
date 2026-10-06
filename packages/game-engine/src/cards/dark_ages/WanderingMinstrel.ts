import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
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
    await ie.revealCards(topCards);

    const actions: CardCollection = topCards.getMatchingCards(isActionCard);
    const nonActions: CardCollection = topCards.getMatchingCards(not(isActionCard));

    await ie.topDeckCardsFromRevealedSet(actions);
    await ie.discardCardsFromRevealedSet(nonActions);
  }
}
