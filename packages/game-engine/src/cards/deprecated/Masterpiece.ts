import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Masterpiece (Treasure): $1. When you overpay for this, gain a Silver per $1 overpaid.
// Overpay mechanic is not implemented in the engine.
export class Masterpiece extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Masterpiece'));
    this.setCoins(1);
    this.markAsSimpleTreasure();
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(1);
    // TODO: Overpay mechanic — gain a Silver per $1 overpaid when bought
  }
}
