import { CardInfoLookup } from '@dominion/card-info';

import { Project } from '../../card/Project';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

/**
 * Pageant: At the end of your Buy phase, you may pay $1 for +1 Coffers.
 *
 * Stub: Buy-phase coin spending and BUY_END player interaction not yet
 * supported as a persistent Project hook.
 */
export class Pageant extends Project {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Pageant'));
  }

  public async onBuy(_ie: InstructionExecutor): Promise<void> {
    // stub: BUY_END coin-pay interaction not yet implemented
  }
}
