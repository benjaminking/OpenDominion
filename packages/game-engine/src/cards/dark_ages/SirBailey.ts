import { CardInfoLookup } from '@dominion/card-info';

import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Knights } from './Knights';

export class SirBailey extends Knights {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sir Bailey'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    await ie.performAttack(this, this.knightAttack.bind(this));
  }
}
