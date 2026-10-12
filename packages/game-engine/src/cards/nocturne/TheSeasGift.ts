import { CardInfoLookup } from '@dominion/card-info';

import { Boon } from '../../card/Boon';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class TheSeasGift extends Boon {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo("The Sea's Gift"));
  }

  public async receive(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
  }
}
