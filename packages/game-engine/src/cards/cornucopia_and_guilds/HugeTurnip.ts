import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class HugeTurnip extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Huge Turnip'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addCoffers(2);
    await ie.addCoins(ie.getCoffers());
  }
}
