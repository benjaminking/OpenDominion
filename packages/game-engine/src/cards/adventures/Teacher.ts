import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Teacher extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Teacher'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    // Put this on your Tavern mat.
    // At the start of your turn, you may call this to move a +1 Action/Card/$1/Buy token to an Action Supply pile.
    ie.putCardOnTavernMat(this);
  }
}
