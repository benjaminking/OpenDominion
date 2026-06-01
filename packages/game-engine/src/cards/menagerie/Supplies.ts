import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Supplies extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Supplies'));
    this.setCoins(1);
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addCoins(1);
    await ie.gainHorse(1, CardLocation.DECK);
  }
}
