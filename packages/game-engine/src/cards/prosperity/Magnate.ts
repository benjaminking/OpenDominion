import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class Magnate extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Magnate'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.revealHand();

    const numTreasuresInHand = ie.numMatchingCardsInHand(isTreasureCard);
    await ie.drawCards(numTreasuresInHand);
  }
}
