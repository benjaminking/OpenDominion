import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Town extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Town'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('+1 Card and +2 Actions', async () => {
          await ie.drawCards(1);
          ie.addActions(2);
        }),
      )
      .from(
        new ActionChoice('+1 Buy and +$2', async () => {
          ie.addBuys(1);
          ie.addCoins(2);
        }),
      )
      .choose();
  }
}
