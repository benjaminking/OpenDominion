import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class City extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('City'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(2);

    const numEmptySupplyPiles = ie.getSharedGameState().piles.numEmptySupplyPiles;
    if (numEmptySupplyPiles >= 1) {
      await ie.drawCards(1);
    }
    if (numEmptySupplyPiles >= 2) {
      ie.addBuys(1);
      await ie.addCoins(1);
    }
  }
}
