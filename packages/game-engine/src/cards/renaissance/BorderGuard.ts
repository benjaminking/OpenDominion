import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

export class BorderGuard extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Border Guard'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);

    // Reveal top 2 cards; put one in hand, discard the other.
    const topCards: CardCollection = await ie.takeCardsOffDeck(2);
    await ie.revealCards(topCards);

    if (topCards.size() === 0) {
      return;
    }

    const bothAreActions = topCards.size() === 2 && topCards.getMatchingCards(isActionCard).size() === 2;

    if (topCards.size() === 1) {
      // Only one card — take it.
      const only = topCards.getArbitraryCard()!;
      ie.putCardsIntoHandFromSet(CardCollection.fromCards([only]), topCards);
    } else {
      const cardToKeep: Card | Choice = await ie
        .chooseCard('Choose a card to put into your hand (the other is discarded)')
        .from(topCards)
        .to(CardSelectionPurpose.OTHER)
        .choose();
      if (cardToKeep instanceof Card) {
        ie.putCardsIntoHandFromSet(CardCollection.fromCards([cardToKeep]), topCards);
      }
      // Discard remaining cards.
      for (const card of topCards) {
        await ie.discardCardFromLocation(card, card.getLocation());
      }
    }

    // If both were Actions, offer to take the Lantern or Horn.
    if (bothAreActions) {
      await ie
        .chooseOneOption('Both were Actions — take the Lantern or Horn:')
        .from(
          new ActionChoice('Take the Lantern', () => {
            ie.takeArtifact('Lantern');
          }),
        )
        .from(
          new ActionChoice('Take the Horn', () => {
            ie.takeArtifact('Horn');
          }),
        )
        .choose();
    }
  }
}
