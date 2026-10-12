import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

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
