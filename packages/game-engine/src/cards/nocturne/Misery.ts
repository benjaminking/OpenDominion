import { CardInfoLookup } from '@dominion/card-info';

import { Hex } from '../../card/Hex';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

// Misery: If this is your first Misery this game, take Miserable. Otherwise, flip it over to Twice Miserable.
export class Misery extends Hex {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Misery'));
  }

  public async receive(ie: InstructionExecutor): Promise<void> {
    if (ie.hasState('Miserable')) {
      ie.takeState('Twice Miserable');
    } else {
      ie.takeState('Miserable');
    }
  }
}
