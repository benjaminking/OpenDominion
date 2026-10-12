import { CardInfoLookup } from '@dominion/card-info';

import { Boon } from '../../card/Boon';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

// The Field's Gift: +1 Action, +$1 (keep this until Clean-up).
// The Duration-like "keep until cleanup" part requires engine support; the immediate effect is applied here.
export class TheFieldsGift extends Boon {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo("The Field's Gift"));
  }

  public async receive(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    await ie.addCoins(1);
  }
}
