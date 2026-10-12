import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Stockpile extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Stockpile'));
    this.setCoins(3);
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addCoins(3);
    ie.addBuys(1);
    await ie.exileCardFromLocation(this, CardLocation.IN_PLAY);
  }
}
