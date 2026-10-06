import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class AbandonedMine extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Abandoned Mine'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(1);
  }
}
