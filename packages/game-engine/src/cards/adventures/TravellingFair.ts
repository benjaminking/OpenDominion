import { CardInfoLookup } from '@dominion/card-info';

import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class TravellingFair extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Travelling Fair'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // +2 Buys. When you gain a card this turn, you may put it onto your deck (stub: +2 Buys only).
    ie.addBuys(2);
    // TODO: implement optional top-deck on gain effect
  }
}
