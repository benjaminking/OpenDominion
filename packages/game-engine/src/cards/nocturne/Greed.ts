import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Hex } from '../../card/Hex';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Greed: Gain a Copper onto your deck.
export class Greed extends Hex {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Greed'));
  }

  public async receive(ie: InstructionExecutor): Promise<void> {
    await ie.gainFromPile('Copper', CardLocation.DECK);
  }
}
