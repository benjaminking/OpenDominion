import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Fortune extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Fortune'));
    this.markAsSimpleTreasure();
    this.setCoins(0);
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);
    // If you haven't doubled your coins this turn, double your coins
    if (!ie.hasDoubledCoinsThisTurn()) {
      const currentCoins = ie.getCoinsAvailable();
      await ie.addCoins(currentCoins);
    }
  }
}
