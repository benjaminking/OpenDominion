import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Doubloons extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Doubloons'));
    this.markAsSimpleTreasure();
    this.setCoins(3);
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(3);
  }
}
