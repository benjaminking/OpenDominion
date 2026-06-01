import { CardInfoLookup } from '@dominion/card-info';

import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { NoThirdConsecutiveTurnPrecondition } from '../../turns/ExtraTurnPreconditions';

export class SeizetheDay extends Event {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Seize the Day'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    if (!ie.canUseOncePerGame('seize_the_day')) {
      return;
    }

    ie.addExtraTurn(this, [new NoThirdConsecutiveTurnPrecondition()]);
    ie.markUsedOncePerGame('seize_the_day');
  }
}
