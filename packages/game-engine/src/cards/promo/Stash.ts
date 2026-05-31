import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Stash (Treasure): $2.
// When shuffling this, you may look through your remaining deck,
// and may put this anywhere in the shuffled cards.
// Stub: shuffle interception is not yet supported in the engine.
export class Stash extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Stash'));
    this.setCoins(2);
    this.markAsSimpleTreasure();
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    return ie.addCoins(2);
    // TODO: On shuffle, player may place Stash anywhere in the shuffled deck.
  }
}
