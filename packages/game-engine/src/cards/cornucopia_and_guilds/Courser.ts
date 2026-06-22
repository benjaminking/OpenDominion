import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { ActionChoice } from '../../decisions/ActionChoice';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Courser extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Courser'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseMultipleOptions('Choose two different options:')
      .from(
        new ActionChoice('+2 Cards', async () => {
          await ie.drawCards(2);
        }),
      )
      .from(
        new ActionChoice('+2 Actions', () => {
          ie.addActions(2);
        }),
      )
      .from(
        new ActionChoice('+$2', async () => {
          await ie.addCoins(2);
        }),
      )
      .from(
        new ActionChoice('Gain 4 Silvers', async () => {
          await ie.gainCardFromPileNTimes('Silver', 4);
        }),
      )
      .choose(2);
  }
}
