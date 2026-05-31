import { CardInfoLookup } from '@dominion/card-info';

import { Hex } from '../../card/Hex';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Envy: If you don't have Deluded or Envious, take Envious.
export class Envy extends Hex {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Envy'));
  }

  public async receive(ie: InstructionExecutor): Promise<void> {
    if (!ie.hasState('Deluded') && !ie.hasState('Envious')) {
      ie.takeState('Envious');
    }
  }
}
