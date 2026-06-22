import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

export class Housecarl extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Housecarl'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const numUniqueActionsInPlay = ie.numUniqueMatchingCardsInPlay(isActionCard);
    await ie.drawCards(numUniqueActionsInPlay);
  }
}
