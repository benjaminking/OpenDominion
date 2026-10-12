import { CardInfoLookup } from '@dominion/card-info';

import { Event } from '../../card/Event';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Delve extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Delve'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);
    await ie.gainCardFromPile('Silver');
  }
}
