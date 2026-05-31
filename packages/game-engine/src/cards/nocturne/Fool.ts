import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Fool (Action/Fate): If you aren't the player with Lost in the Woods: take it, take 3 Boons, receive them.
// State card management and 3-Boon selection require engine support.
export class Fool extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Fool'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    if (!ie.hasState('Lost in the Woods')) {
      ie.takeState('Lost in the Woods');
      await ie.receiveBoon();
      await ie.receiveBoon();
      await ie.receiveBoon();
    }
  }
}
