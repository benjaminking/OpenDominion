import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

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
