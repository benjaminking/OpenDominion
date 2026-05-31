import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { Hex } from '../../card/Hex';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

// Famine: Reveal the top 3 cards of your deck. Discard the Actions. Shuffle the rest into your deck.
export class Famine extends Hex {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Famine'));
  }

  public async receive(ie: InstructionExecutor): Promise<void> {
    const topCards = await ie.takeCardsOffDeck(3);
    if (topCards.size() === 0) {
      return;
    }
    await ie.revealCards(topCards);
    const actionsToDiscard: CardCollection = topCards.getMatchingCards(isActionCard);
    await ie.discardCardsFromRevealedSet(actionsToDiscard, topCards);
    // Shuffle remaining cards into deck
    await ie.shuffleCardsIntoDeck(topCards);
  }
}
