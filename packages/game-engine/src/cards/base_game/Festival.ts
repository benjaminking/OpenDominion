import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Festival extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Festival'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(2);
    ie.addBuys(1);
    await ie.addCoins(2);
    return Promise.resolve();
  }
}
