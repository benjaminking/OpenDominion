import { CardInfoLookup } from '@dominion/card-info';

import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Mission extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Mission'));
  }

  public async onBuy(_ie: InstructionExecutor): Promise<void> {
    // Take an extra turn after this one (not a 3rd in a row), during which you can't buy cards.
    // TODO: implement extra turn from Event source (requires Event->Card cast or infrastructure change)
  }
}
