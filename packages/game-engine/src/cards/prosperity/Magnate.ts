import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class Magnate extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Magnate'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.revealHand();
    await ie.drawCards(ie.numMatchingCardsInHand(isTreasureCard));
  }
}
