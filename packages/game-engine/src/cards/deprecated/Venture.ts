import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';

// Venture (Treasure): $1. When you play this, reveal cards from your deck until you reveal a Treasure.
// Discard the other cards. Play that Treasure.
export class Venture extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Venture'));
    this.setCoins(1);
    this.markAsSimpleTreasure();
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(1);
    const discardPile = new CardCollection();
    let foundTreasure = undefined;
    while (foundTreasure === undefined) {
      const card = await ie.takeCardOffDeck();
      if (card === undefined) {
        break;
      }
      if (isTreasureCard.matches(card)) {
        foundTreasure = card;
      } else {
        discardPile.addCard(card);
      }
    }
    if (discardPile.size() > 0) {
      await ie.discardCards(discardPile, CardLocation.REVEAL_LIMBO);
    }
    if (foundTreasure !== undefined) {
      await ie.playCardFromLocation(foundTreasure, CardLocation.REVEAL_LIMBO);
    }
  }
}
