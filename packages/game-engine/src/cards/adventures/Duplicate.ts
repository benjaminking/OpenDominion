import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Duplicate extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Duplicate'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    // Put this on your Tavern mat.
    // When you gain a card, you may call this to gain a copy of it.
    ie.putCardOnTavernMat(this);
  }
}
