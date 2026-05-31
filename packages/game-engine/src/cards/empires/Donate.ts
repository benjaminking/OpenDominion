import { CardInfoLookup } from '@dominion/card-info';

import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Donate extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Donate'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // After this turn: put your deck and discard into hand, trash any,
    // shuffle the rest, and draw 5.
    // TODO: Full implementation requires post-turn hook support.
    // Stub: delegate to performDonate which will be implemented when infrastructure is ready.
    await ie.performDonate();
  }
}
