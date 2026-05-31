import { CardInfoLookup } from '@dominion/card-info';

import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Borrow extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Borrow'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // Once per turn: +1 Buy. If your -1 Card token isn't on your deck, put it there and +$1.
    if (ie.oncePerTurn('Borrow')) {
      return;
    }
    ie.addBuys(1);
    // Stub: -1 Card token mechanic not implemented; always give +$1
    ie.giveMinusOneCardToken(ie.getSharedGameState().getCurrentPlayer());
    await ie.addCoins(1);
  }
}
