import { CardInfoLookup } from '@dominion/card-info';

import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Knights } from './Knights';

export class SirDestry extends Knights {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sir Destry'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);
    await ie.performAttack(this, this.knightAttack.bind(this));
  }
}
