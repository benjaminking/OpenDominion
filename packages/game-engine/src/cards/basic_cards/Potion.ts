import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Potion extends Card {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Potion'));
    this.markAsSimpleTreasure();
    this.setCoins(0);
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addPotions(1);
    return Promise.resolve();
  }
}
