import { CardInfoLookup } from '@dominion/card-info';

import { Hex } from '../../card/Hex';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

// Poverty: Discard down to 3 cards in hand.
export class Poverty extends Hex {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Poverty'));
  }

  public async receive(ie: InstructionExecutor): Promise<void> {
    await ie.discardDownTo(3);
  }
}
