import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class CharlatanCurse extends Card {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Charlatan Curse'));
    this.markAsSimpleTreasure();
    this.setCoins(1);
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(1);
  }

  public score() {
    return -1;
  }

  public getDisplayName(): string {
    return 'Curse';
  }

  public getPileName(): string {
    return 'Curse';
  }
}
