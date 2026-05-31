import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardType } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard, isTreasureCard } from '../../StandardCardEligibilityFunctions';

const isActionOrTreasure = new CardEligibilityFunction((c) => isActionCard.matches(c) || isTreasureCard.matches(c));

// Farming Village (Action): +2 Actions. Reveal cards from your deck until you reveal
// a Treasure or Action card. Put that card into your hand and discard the rest.
export class FarmingVillage extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Farming Village'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(2);
    const discardPile = new CardCollection();
    let found = false;
    while (!found) {
      const card = await ie.takeCardOffDeck();
      if (card === undefined) {
        break;
      }
      if (isActionOrTreasure.matches(card)) {
        ie.putCardIntoHandFromLocation(card, CardLocation.REVEAL_LIMBO);
        found = true;
      } else {
        discardPile.addCard(card);
      }
    }
    if (discardPile.size() > 0) {
      await ie.discardCards(discardPile, CardLocation.REVEAL_LIMBO);
    }
  }
}
