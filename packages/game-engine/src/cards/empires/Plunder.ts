import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Plunder extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Plunder'));
    this.markAsSimpleTreasure();
    this.setCoins(2);
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addVP(1);
  }
}
