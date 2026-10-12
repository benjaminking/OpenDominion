import { CardInfoLookup } from '@dominion/card-info';

import { Event } from '../../card/Event';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Wedding extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Wedding'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    ie.addVP(1);
    await ie.gainCardFromPile('Gold');
  }
}
