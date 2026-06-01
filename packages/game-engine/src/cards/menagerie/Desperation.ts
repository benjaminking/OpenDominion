import { CardInfoLookup } from '@dominion/card-info';

import { ActionChoice } from '../../decisions/ActionChoice';
import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Desperation extends Event {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Desperation'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    if (!ie.canUseOncePerTurn('desperation')) {
      return;
    }

    await ie
      .chooseOneOption('You may gain a Curse for +1 Buy and +$2')
      .from(
        new ActionChoice('Gain a Curse', async () => {
          await ie.gainFromPile('Curse');
          ie.addBuys(1);
          ie.addCoins(2);
          ie.markUsedOncePerTurn('desperation');
        }),
      )
      .from(new ActionChoice('Skip', async () => Promise.resolve()))
      .choose();
  }
}
