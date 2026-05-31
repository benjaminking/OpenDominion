import { CardInfoLookup } from '@dominion/card-info';

import { Project } from '../../card/Project';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

/**
 * Capitalism: During your turns, Action cards with +$ amounts in their text
 * are also Treasures.
 *
 * Stub: dynamically assigning extra card types based on card text at runtime
 * is not yet supported by the engine.
 */
export class Capitalism extends Project {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Capitalism'));
  }

  public async onBuy(_ie: InstructionExecutor): Promise<void> {
    // stub: runtime card-type modification not implemented
  }
}
