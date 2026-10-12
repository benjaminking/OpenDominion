import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

// Haunted Mirror (Treasure/Heirloom): $1.
// When you trash this, you may discard an Action card to gain a Ghost.
// The on-trash effect requires engine support; approximated as stub.
export class HauntedMirror extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Haunted Mirror'));
    this.setCoins(1);
    this.markAsSimpleTreasure();
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    return ie.addCoins(1);
  }
}
