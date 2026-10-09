import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Platinum extends Card {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Platinum'));
    this.markAsSimpleTreasure();
    this.setCoins(5);
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    return ie.addCoins(5);
  }
}
