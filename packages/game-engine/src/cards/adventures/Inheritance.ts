import { CardInfoLookup } from '@dominion/card-info';

import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Inheritance extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Inheritance'));
  }

  public async onBuy(_ie: InstructionExecutor): Promise<void> {
    // Once per game: set aside an Action card costing up to $4; Estates become that card (stub)
    // TODO: implement Inheritance mechanic
  }
}
