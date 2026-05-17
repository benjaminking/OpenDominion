import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

export class Conspirator extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Conspirator'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);

    if (ie.numMatchingCardsPlayedThisTurn(isActionCard) >= 3) {
      await ie.drawCards(1);
      ie.addActions(1);
    }
  }
}
