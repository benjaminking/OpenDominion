import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Cursed Gold (Treasure/Heirloom): $3. When you play this, gain a Curse.
export class CursedGold extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Cursed Gold'));
    this.setCoins(3);
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(3);
    await ie.gainCardFromPile('Curse');
  }
}
