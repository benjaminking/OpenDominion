import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { anyCard } from '../../StandardCardEligibilityFunctions';

export class Menagerie extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Menagerie'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    await ie.revealHand();

    if(ie.numUniqueMatchingCardsInHand(anyCard) === ie.handSize()) {
      await ie.drawCards(3);
    } else {
      await ie.drawCards(1);
    }
  }
}
