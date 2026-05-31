import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';

// Adventurer (Action): Reveal cards from your deck until you reveal 2 Treasure cards.
// Put those Treasure cards into your hand and discard the other revealed cards.
export class Adventurer extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Adventurer'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const discardPile = new CardCollection();
    let treasuresFound = 0;
    while (treasuresFound < 2) {
      const card = await ie.takeCardOffDeck();
      if (card === undefined) {
        break;
      }
      if (isTreasureCard.matches(card)) {
        ie.putCardIntoHandFromLocation(card, CardLocation.REVEAL_LIMBO);
        treasuresFound++;
      } else {
        discardPile.addCard(card);
      }
    }
    if (discardPile.size() > 0) {
      await ie.discardCards(discardPile, CardLocation.REVEAL_LIMBO);
    }
  }
}
