import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Hex } from '../../card/Hex';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Plague: Gain a Curse to your hand.
export class Plague extends Hex {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Plague'));
  }

  public async receive(ie: InstructionExecutor): Promise<void> {
    await ie.gainFromPile('Curse', CardLocation.HAND);
  }
}
