import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class TownCrier extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Town Crier'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('+$2', async () => {
          ie.addCoins(2);
        }),
      )
      .from(
        new ActionChoice('Gain a Silver', async () => {
          await ie.gainFromPile('Silver');
        }),
      )
      .from(
        new ActionChoice('+1 Card and +1 Action', async () => {
          await ie.drawCards(1);
          ie.addActions(1);
        }),
      )
      .choose();

    ie.rotatePileGroup('Townsfolk');
  }
}
