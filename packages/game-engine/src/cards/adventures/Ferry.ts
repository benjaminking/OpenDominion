import { CardInfoLookup } from '@dominion/card-info';

import { Event } from '../../card/Event';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Ferry extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Ferry'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // Move your -$2 token to an Action Supply pile (stub)
    ie.applyPileToken('', 'ferry');
  }
}
