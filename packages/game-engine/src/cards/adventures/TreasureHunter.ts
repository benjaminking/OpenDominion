import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class TreasureHunter extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Treasure Hunter'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    await ie.addCoins(1);
    const numGained = ie.getNumCardsGainedLastTurnByRightPlayer();
    for (let i = 0; i < numGained; i++) {
      await ie.gainCardFromPile('Silver');
    }
  }
}
