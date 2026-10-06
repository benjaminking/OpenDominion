import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class RuinedVillage extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Ruined Village'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    return Promise.resolve();
  }
}
