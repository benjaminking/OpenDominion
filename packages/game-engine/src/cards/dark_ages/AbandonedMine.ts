import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class AbandonedMine extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Abandoned Mine'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(1);
  }
}
