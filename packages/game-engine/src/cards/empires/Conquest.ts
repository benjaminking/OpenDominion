import { CardInfoLookup } from '@dominion/card-info';

import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Conquest extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Conquest'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // Gain 2 Silvers
    await ie.gainCardFromPile('Silver');
    await ie.gainCardFromPile('Silver');
    // +1 VP per Silver you've gained this turn
    const silversGained = ie.getNumSilversGainedThisTurn();
    ie.addVP(silversGained);
  }
}
