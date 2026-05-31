import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsBetween } from '../../StandardCardEligibilityFunctions';

export class Seer extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Seer'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);

    // Reveal top 3 cards; put ones costing $2–$4 into hand; put the rest back in any order.
    const topCards: CardCollection = await ie.takeCardsOffDeck(3);
    await ie.revealCards(topCards);

    const twoToFour = costsBetween(Cost.Simple(2), Cost.Simple(4));
    const toHand = topCards.getMatchingCards(twoToFour);

    // putCardsIntoHandFromSet removes `toHand` from `topCards`, leaving only cards to return.
    ie.putCardsIntoHandFromSet(toHand, topCards);

    if (topCards.size() > 0) {
      await ie.topDeckCardsFromRevealedSet(topCards);
    }
  }
}
