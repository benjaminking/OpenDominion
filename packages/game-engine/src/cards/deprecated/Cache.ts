import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Cache (Treasure): $3. When you gain this, gain 2 Coppers.
// On-gain effect not implemented here; only treasure value.
export class Cache extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Cache'));
    this.setCoins(3);
    this.markAsSimpleTreasure();
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(3);
    // TODO: Gain 2 Coppers when this is gained (on-gain trigger not implemented)
  }
}
