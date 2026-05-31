import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

// Housecarl (Reward): +1 Card per differently named Action card you have
// in play (including this).
export class Housecarl extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Housecarl'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    // Count differently named Action cards in play
    const inPlay = ie.getSharedGameState().getCurrentPlayer().getOwnedCards().getInPlay();
    const uniqueActionNames = inPlay.getMatchingCards(isActionCard).cardGroups().length;
    await ie.drawCards(uniqueActionNames);
  }
}
