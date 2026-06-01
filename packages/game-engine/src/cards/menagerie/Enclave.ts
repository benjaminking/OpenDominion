import { CardInfoLookup } from '@dominion/card-info';

import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Enclave extends Event {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Enclave'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    await ie.gainFromPile('Gold');
    await ie.exileFromSupply('Duchy');
  }
}
