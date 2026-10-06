import { CardInfoLookup } from '@dominion/card-info';

import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Knights } from './Knights';

export class DameMolly extends Knights {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Dame Molly'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(2);
    await ie.performAttack(this, this.knightAttack.bind(this));
  }
}
