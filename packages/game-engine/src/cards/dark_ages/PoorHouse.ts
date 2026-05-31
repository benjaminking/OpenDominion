import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class PoorHouse extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Poor House'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(4);
    await ie.revealHand();
    const numTreasures = ie.numMatchingCardsInHand(isTreasureCard);
    if (numTreasures > 0) {
      const currentCoins = ie.getSharedGameState().getCurrentPlayer().getStatistics().getCoins();
      await ie.addCoins(-Math.min(numTreasures, currentCoins));
    }
  }
}
