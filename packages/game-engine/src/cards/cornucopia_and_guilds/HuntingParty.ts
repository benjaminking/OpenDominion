import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

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

    const nonDuplicateCard = await ie.revealUntil(ie.createIsNotDuplicateWithHandCardEligibilityFunction(), 1);
    ie.putCardsIntoHandFromLocation(nonDuplicateCard, CardLocation.REVEAL_LIMBO);
  }
}
