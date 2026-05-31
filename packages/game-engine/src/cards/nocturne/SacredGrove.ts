import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Sacred Grove (Action/Fate): +1 Buy, +$3. Receive a Boon.
// If it doesn't give +$1, each other player may receive it.
// The "shared boon" mechanic requires engine support; approximated with receiveBoon().
export class SacredGrove extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sacred Grove'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);
    await ie.addCoins(3);
    await ie.receiveBoon();
  }
}
