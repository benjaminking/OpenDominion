import { CardInfoLookup } from '@dominion/card-info';

import { Boon } from '../../card/Boon';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// The Forest's Gift: +1 Buy, +$1 (keep this until Clean-up).
// The Duration-like "keep until cleanup" part requires engine support; the immediate effect is applied here.
export class TheForestsGift extends Boon {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo("The Forest's Gift"));
  }

  public async receive(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);
    await ie.addCoins(1);
  }
}
