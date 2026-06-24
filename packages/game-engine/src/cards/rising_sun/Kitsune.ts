import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Kitsune extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Kitsune'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    await ie
      .chooseMultipleOptions('Choose two different options:')
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
        new ActionChoice('Each other player gains a Curse', async () => {
          await ie.eachOtherPlayer(async (otherIe: InstructionExecutor) => {
            await otherIe.gainCardFromPile('Curse');
          });
        }),
      )
      .from(
        new ActionChoice('Gain a Silver', async () => {
          await ie.gainCardFromPile('Silver');
        }),
      )
      .choose(2);
  }
}
