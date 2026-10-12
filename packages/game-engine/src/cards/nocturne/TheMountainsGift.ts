import { CardInfoLookup } from '@dominion/card-info';

import { Boon } from '../../card/Boon';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class TheMountainsGift extends Boon {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo("The Mountain's Gift"));
  }

  public async receive(ie: InstructionExecutor): Promise<void> {
    await ie.gainFromPile('Silver');
  }
}
