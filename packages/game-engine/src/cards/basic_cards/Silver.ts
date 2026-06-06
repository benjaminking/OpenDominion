import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Silver extends Card {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Silver'));
    this.markAsSimpleTreasure();
    this.setCoins(2);
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    return ie.addCoins(2);
  }
}
