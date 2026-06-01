import { CardInfoLookup } from '@dominion/card-info';

import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Commerce extends Event {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Commerce'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    const n = ie.getNumDifferentlyNamedCardsGainedThisTurn();
    for (let i = 0; i < n; i++) {
      await ie.gainFromPile('Gold');
    }
  }
}
