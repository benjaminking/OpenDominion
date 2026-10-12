import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

// Chancellor (Action): +$2. You may immediately put your deck into your discard pile.
export class Chancellor extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Chancellor'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
    await ie
      .chooseOneOption('You may put your deck into your discard pile')
      .from(
        new ActionChoice('Put deck into discard', async () => {
          ie.putDeckInDiscard();
        }),
      )
      .from(new ActionChoice('Keep deck'))
      .choose();
  }
}
