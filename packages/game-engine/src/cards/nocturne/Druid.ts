import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

// Druid (Action/Fate): +1 Buy. Receive one of the set-aside Boons (leaving it there).
// The 3 set-aside Boons mechanic requires engine support (Druid setup). Stubbed via receiveBoon().
export class Druid extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Druid'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);
    await ie.receiveBoon();
  }
}
