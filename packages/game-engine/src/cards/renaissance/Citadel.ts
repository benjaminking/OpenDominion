import { CardInfoLookup } from '@dominion/card-info';

import { Project } from '../../card/Project';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

/**
 * Citadel: The first time you play an Action card during each of your turns,
 * replay it afterwards.
 *
 * Stub: "first Action played this turn" tracking and auto-replay requires
 * engine-level hook (ABOUT_TO_PLAY_CARD or similar) not yet wired to Projects.
 */
export class Citadel extends Project {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Citadel'));
  }

  public async onBuy(_ie: InstructionExecutor): Promise<void> {
    // stub: first-Action-replay not yet implemented
  }
}
