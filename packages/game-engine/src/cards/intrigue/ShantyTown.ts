import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

export class ShantyTown extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Shanty Town'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(2);
    await ie.revealHand();
    if (!ie.hasMatchingCardInHand(isActionCard)) {
      await ie.drawCards(2);
    }
  }
}
