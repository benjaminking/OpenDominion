import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Necropolis extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Necropolis'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(2);
    return Promise.resolve();
  }
}
