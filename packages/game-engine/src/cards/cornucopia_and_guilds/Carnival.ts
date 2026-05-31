import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Carnival: Reveal the top 4 cards of your deck. Put one of each differently
// named card into your hand and discard the rest.
export class Carnival extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Carnival'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const topCards: CardCollection = await ie.takeCardsOffDeck(4);
    await ie.revealCards(topCards);

    // For each unique name, keep the first encountered card; discard duplicates
    const seenNames = new Set<string>();
    const toHand: CardCollection = new CardCollection();
    const toDiscard: CardCollection = new CardCollection();

    for (const card of topCards.asCardArray()) {
      const name = card.getName();
      if (!seenNames.has(name)) {
        seenNames.add(name);
        toHand.addCard(card);
      } else {
        toDiscard.addCard(card);
      }
    }

    // Move chosen cards into hand from the revealed set
    topCards.removeCards(toHand);
    await ie.putCardsIntoHandFromSet(toHand, topCards);

    // Discard the rest (still remaining in topCards)
    const remaining: CardCollection = topCards.clone();
    await ie.discardCardsFromRevealedSet(remaining, topCards);
  }
}
