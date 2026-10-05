import { CardInfoLookup } from '@dominion/card-info';

import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Knights } from './Knights';

export class SirMartin extends Knights {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sir Martin'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(2);
    await ie.performAttack(this, this.knightAttack.bind(this));
  }
}
