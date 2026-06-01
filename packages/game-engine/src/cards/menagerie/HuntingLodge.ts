import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class HuntingLodge extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Hunting Lodge'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(2);

    await ie
      .chooseOneOption('You may discard your hand for +5 Cards')
      .from(
        new ActionChoice('Discard hand and draw 5', async () => {
          await ie.discardHand();
          await ie.drawCards(5);
        }),
      )
      .from(new ActionChoice('Keep hand', async () => Promise.resolve()))
      .choose();
  }
}
