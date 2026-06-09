import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Gold extends Card {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Gold'));
    this.markAsSimpleTreasure();
    this.setCoins(3);
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    return ie.addCoins(3);
  }
}
