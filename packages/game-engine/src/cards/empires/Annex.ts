import { CardInfoLookup } from '@dominion/card-info';

import { Event } from '../../card/Event';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Annex extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Annex'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // TODO: Look through your discard pile; shuffle all but up to 5 into deck
    // Then gain a Duchy
    // (Full implementation requires discard inspection and partial shuffle — stubbed)
    await ie.gainCardFromPile('Duchy');
  }
}
