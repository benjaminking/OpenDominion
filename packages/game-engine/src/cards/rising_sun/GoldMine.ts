import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class GoldMine extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Gold Mine'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    ie.addBuys(1);

    await ie
      .chooseOneOption('You may gain a Gold and get +4 Debt')
      .from(
        new ActionChoice('Gain a Gold', async () => {
          await ie.gainCardFromPile('Gold');
          ie.addDebt(4);
        }),
      )
      .from(new ActionChoice('Do nothing', () => Promise.resolve()))
      .choose();
  }
}
