import { CardInfoLookup } from '@dominion/card-info';

import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Expedition extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Expedition'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // Draw 2 extra cards for your next hand.
    // Stub: implemented as drawing 2 extra cards at end of cleanup (not fully supported)
    ie.setNumCardsToDrawInCleanup(7); // default is 5, so +2
  }
}
