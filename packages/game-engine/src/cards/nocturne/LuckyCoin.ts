import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Lucky Coin (Treasure/Heirloom): $1. When you play this, gain a Silver.
export class LuckyCoin extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Lucky Coin'));
    this.setCoins(1);
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(1);
    await ie.gainFromPile('Silver');
  }
}
