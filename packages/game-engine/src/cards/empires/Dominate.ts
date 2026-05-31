import { CardInfoLookup } from '@dominion/card-info';

import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Dominate extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Dominate'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // Gain a Province; if you did, +9 VP
    const gained = await ie.gainCardFromPile('Province');
    if (gained !== undefined) {
      ie.addVP(9);
    }
  }
}
