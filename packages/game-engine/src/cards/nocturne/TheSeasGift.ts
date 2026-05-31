import { CardInfoLookup } from '@dominion/card-info';

import { Boon } from '../../card/Boon';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class TheSeasGift extends Boon {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo("The Sea's Gift"));
  }

  public async receive(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
  }
}
