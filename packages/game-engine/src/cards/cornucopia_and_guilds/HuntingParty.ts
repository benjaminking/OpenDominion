import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Hunting Party: +1 Card, +1 Action. Reveal your hand. Look at the top cards
// of your deck until you reveal one that isn't a duplicate of a card in your
// hand. Put it into your hand and discard the rest.
export class HuntingParty extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Hunting Party'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    await ie.revealHand();

    const handNames = new Set<string>(
      ie.getSharedGameState().getCurrentPlayer().getOwnedCards().getHand().asCardArray().map((c) => c.getName()),
    );

    // Look at top cards until finding one whose name is not in hand
    let found = false;
    while (!found) {
      const topCard: Card | undefined = await ie.takeCardOffDeck();
      if (topCard === undefined) {
        break;
      }
      if (!handNames.has(topCard.getName())) {
        await ie.putCardIntoHandFromLocation(topCard, CardLocation.REVEAL_LIMBO);
        found = true;
      } else {
        await ie.discardCard(topCard);
      }
    }
  }
}
