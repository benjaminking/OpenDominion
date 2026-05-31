import { CardInfoLookup } from '@dominion/card-info';

import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Tax extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Tax'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // TODO: Add 2 Debt tokens to a Supply pile
    // Requires supply pile selection UI — stubbed for now
    ie.addDebt(2);
  }
}
