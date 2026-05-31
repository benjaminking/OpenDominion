import { CardInfoLookup } from '@dominion/card-info';

import { Project } from '../../card/Project';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

/**
 * Star Chart: When shuffling, you may pick one of the cards to go on top.
 *
 * Stub: SHUFFLE trigger exists but the ability to designate one card to go on
 * top during a shuffle is not yet implemented in the engine.
 */
export class StarChart extends Project {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Star Chart'));
  }

  public async onBuy(_ie: InstructionExecutor): Promise<void> {
    // stub: shuffle-order intervention not yet implemented
  }
}
