import { CardInfoLookup } from '@dominion/card-info';

import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Alliance extends Event {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Alliance'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    await ie.gainFromPile('Province');
    await ie.gainFromPile('Duchy');
    await ie.gainFromPile('Estate');
    await ie.gainFromPile('Gold');
    await ie.gainFromPile('Silver');
    await ie.gainFromPile('Copper');
  }
}
