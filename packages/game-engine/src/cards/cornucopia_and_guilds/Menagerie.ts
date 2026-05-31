import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { anyCard } from '../../StandardCardEligibilityFunctions';

export class Menagerie extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Menagerie'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    await ie.revealHand();

    // If all revealed cards have different names, +3 Cards; otherwise +1 Card
    const hand = ie.getMatchingCardsInHand(anyCard);
    const uniqueNameCount = hand.cardGroups().length;
    if (uniqueNameCount === hand.size()) {
      await ie.drawCards(3);
    } else {
      await ie.drawCards(1);
    }
  }
}
