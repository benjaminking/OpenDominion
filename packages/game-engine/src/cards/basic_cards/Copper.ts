import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Copper extends Card {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Copper'));
    this.markAsSimpleTreasure();
    this.setCoins(1);
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    return ie.addCoins(1);
  }
}
