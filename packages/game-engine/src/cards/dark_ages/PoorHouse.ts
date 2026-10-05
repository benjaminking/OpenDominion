import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class PoorHouse extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Poor House'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(4);
    await ie.revealHand();

    const numTreasures = ie.numMatchingCardsInHand(isTreasureCard);
    ie.subtractCoins(numTreasures);
  }
}
