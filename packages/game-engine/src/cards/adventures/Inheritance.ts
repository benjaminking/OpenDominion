import { CardInfoLookup } from '@dominion/card-info';

import { Event } from '../../card/Event';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Inheritance extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Inheritance'));
  }

  public async onBuy(_ie: InstructionExecutor): Promise<void> {
    // Once per game: set aside an Action card costing up to $4; Estates become that card (stub)
    // TODO: implement Inheritance mechanic
  }
}
