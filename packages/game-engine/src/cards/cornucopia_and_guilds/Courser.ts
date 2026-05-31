import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Courser (Reward): +2 Cards, +2 Actions, +$2, or gain 4 Silvers
// (choose two different options).
export class Courser extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Courser'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseMultipleOptions('Choose two different options:')
      .from(new ActionChoice('+2 Cards', async () => { await ie.drawCards(2); }))
      .from(new ActionChoice('+2 Actions', () => { ie.addActions(2); }))
      .from(new ActionChoice('+$2', async () => { await ie.addCoins(2); }))
      .from(new ActionChoice('Gain 4 Silvers', async () => {
        for (let i = 0; i < 4; i++) {
          await ie.gainFromPile('Silver');
        }
      }))
      .choose(2);
  }
}
