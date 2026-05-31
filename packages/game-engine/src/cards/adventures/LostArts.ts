import { CardInfoLookup } from '@dominion/card-info';

import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class LostArts extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Lost Arts'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // Move your +1 Action token to an Action Supply pile (stub)
    ie.applyPileToken('', 'lostArts');
  }
}
