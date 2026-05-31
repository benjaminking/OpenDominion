import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class Bank extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Bank'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(ie.numMatchingCardsInPlay(isTreasureCard));
  }
}
