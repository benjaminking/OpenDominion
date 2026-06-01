import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Wayfarer extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Wayfarer'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(3);
    await ie
      .chooseOneOption('You may gain a Silver')
      .from(new ActionChoice('Gain a Silver', async () => await ie.gainFromPile('Silver')))
      .from(new ActionChoice('Skip', async () => Promise.resolve()))
      .choose();
  }
}
