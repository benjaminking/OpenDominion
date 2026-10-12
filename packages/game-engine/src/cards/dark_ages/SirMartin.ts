import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Knights } from './Knights';

export class SirMartin extends Knights {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sir Martin'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const selfExpectation = ie.createLocationExpectation(CardLocation.IN_PLAY);
    ie.addBuys(2);
    await this.performKnightAttack(ie, selfExpectation);
  }
}
