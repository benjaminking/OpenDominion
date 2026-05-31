import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Magic Lamp (Treasure/Heirloom): $1.
// When you play this, if there are 6 or more differently-named cards in play (counting this),
// trash this and gain 3 Wishes.
// Simplified: checks if 6+ cards in play (unique counting not fully implemented).
export class MagicLamp extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Magic Lamp'));
    this.setCoins(1);
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(1);
    // TODO: Proper implementation requires counting uniquely-named cards in play.
    // This is a stub — 6 differently-named in-play cards trigger is not implemented.
  }
}
