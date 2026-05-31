import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Blacksmith extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Blacksmith'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('Draw until you have 6 cards in hand', async () => {
          await ie.drawUpTo(6);
        }),
      )
      .from(
        new ActionChoice('+2 Cards', async () => {
          await ie.drawCards(2);
        }),
      )
      .from(
        new ActionChoice('+1 Card and +1 Action', async () => {
          await ie.drawCards(1);
          ie.addActions(1);
        }),
      )
      .choose();
  }
}
