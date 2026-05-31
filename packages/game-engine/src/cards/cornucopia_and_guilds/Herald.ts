import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

// Herald: +1 Card, +1 Action; reveal top card of deck, if Action play it.
// Overpay: per $1 overpaid, put a card from your discard pile onto your deck.
export class Herald extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Herald'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    // TODO: overpay effect - per $1 overpaid, put discard card onto deck (not yet triggered by buy)

    const topCard: Card | undefined = await ie.takeCardOffDeck();
    if (topCard === undefined) {
      return;
    }
    await ie.revealCard(topCard);

    if (isActionCard.matches(topCard)) {
      // Play it from REVEAL_LIMBO (card location after takeCardOffDeck)
      await ie.playCardFromLocation(topCard, CardLocation.REVEAL_LIMBO);
    } else {
      ie.putCardOnDeck(topCard);
    }
  }
}
