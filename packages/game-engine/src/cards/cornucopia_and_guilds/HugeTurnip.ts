import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Huge Turnip (Reward): +2 Coffers; +$1 per Coffers you have.
// Note: addCoffers() and getCoffers() are stubs — Coffers not yet tracked.
export class HugeTurnip extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Huge Turnip'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    // TODO: addCoffers stub
    ie.addCoffers(2);
    // TODO: getCoffers() stub returns 0, so this adds $0
    await ie.addCoins(ie.getCoffers());
  }
}
