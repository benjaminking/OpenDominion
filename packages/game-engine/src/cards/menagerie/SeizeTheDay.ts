import { CardInfoLookup } from '@dominion/card-info';

import { Event } from '../../card/Event';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class SeizetheDay extends Event {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Seize the Day'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    if (!ie.canUseOncePerGame('seize_the_day')) {
      return;
    }

    // TODO: take an extra turn after this one (not a 3rd turn in a row). ExtraTurn only accepts a Card as its
    // initiator, so an Event can't start one yet (the same gap as Adventures' Mission).
    ie.markUsedOncePerGame('seize_the_day');
  }
}
