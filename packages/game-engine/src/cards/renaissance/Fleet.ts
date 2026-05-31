import { CardInfoLookup } from '@dominion/card-info';

import { Project } from '../../card/Project';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

/**
 * Fleet: After the game ends, there's an extra round of turns just for players
 * with this project.
 *
 * Stub: end-of-game extra turn logic is not yet supported by the engine.
 * (Outpost/extra-turn system exists but is per-player, not end-of-game.)
 */
export class Fleet extends Project {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Fleet'));
  }

  public async onBuy(_ie: InstructionExecutor): Promise<void> {
    // stub: end-of-game extra-round not yet implemented
  }
}
