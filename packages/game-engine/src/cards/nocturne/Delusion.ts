import { CardInfoLookup } from '@dominion/card-info';

import { Hex } from '../../card/Hex';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Delusion: If you don't have Deluded or Envious, take Deluded.
export class Delusion extends Hex {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Delusion'));
  }

  public async receive(ie: InstructionExecutor): Promise<void> {
    if (!ie.hasState('Deluded') && !ie.hasState('Envious')) {
      ie.takeState('Deluded');
    }
  }
}
