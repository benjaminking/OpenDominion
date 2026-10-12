import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Knights } from './Knights';

export class SirBailey extends Knights {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sir Bailey'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const selfExpectation = ie.createLocationExpectation(CardLocation.IN_PLAY);
    await ie.drawCards(1);
    ie.addActions(1);
    await this.performKnightAttack(ie, selfExpectation);
  }
}
