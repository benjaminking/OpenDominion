import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isACopyOf } from '../../StandardCardEligibilityFunctions';

// Doctor (Action): Name a card. Reveal the top 3 cards of your deck.
// Trash the matches. Put the rest back in any order.
export class Doctor extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Doctor'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const namedCard = await ie.nameCard(CardSelectionPurpose.TRASH);
    const topCards = await ie.takeCardsOffDeck(3);
    await ie.revealCards(topCards);
    const toTrash = new CardCollection();
    const toReturn = new CardCollection();
    for (const card of topCards) {
      if (namedCard instanceof Card && isACopyOf(namedCard).matches(card)) {
        toTrash.addCard(card);
      } else {
        toReturn.addCard(card);
      }
    }
    await ie.trashCardsFromSet(toTrash, topCards);
    await ie.topDeckCardsFromRevealedSet(toReturn);
  }
}
