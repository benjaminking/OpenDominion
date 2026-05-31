import { CardInfoLookup } from '@dominion/card-info';

import { Boon } from '../../card/Boon';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class TheMountainsGift extends Boon {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo("The Mountain's Gift"));
  }

  public async receive(ie: InstructionExecutor): Promise<void> {
    await ie.gainFromPile('Silver');
  }
}
