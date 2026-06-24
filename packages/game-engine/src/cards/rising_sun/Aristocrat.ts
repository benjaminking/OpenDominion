import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

export class Aristocrat extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Aristocrat'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const numAristocrats = ie.numMatchingCardsInPlay(cardNameIs('Aristocrat'));

    switch (numAristocrats % 4) {
      case 1:
        ie.addActions(3);
        return;
      case 2:
        await ie.drawCards(3);
        return;
      case 3:
        await ie.addCoins(3);
        return;
      default:
        ie.addBuys(3);
    }
  }
}
