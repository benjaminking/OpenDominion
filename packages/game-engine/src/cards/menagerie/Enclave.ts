import { CardInfoLookup } from '@dominion/card-info';

import { Event } from '../../card/Event';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Enclave extends Event {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Enclave'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    await ie.gainFromPile('Gold');
    await ie.exileFromSupply('Duchy');
  }
}
