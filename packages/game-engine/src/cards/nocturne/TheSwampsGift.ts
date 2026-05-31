import { CardInfoLookup } from '@dominion/card-info';

import { Boon } from '../../card/Boon';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class TheSwampsGift extends Boon {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo("The Swamp's Gift"));
  }

  public async receive(ie: InstructionExecutor): Promise<void> {
    await ie.gainFromSpiritPile("Will-o'-Wisp");
  }
}
