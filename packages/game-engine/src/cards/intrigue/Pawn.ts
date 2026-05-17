import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Pawn extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Pawn'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseMultipleOptions('Choose two:')
      .from(
        new ActionChoice('+1 Card', async () => {
          return ie.drawCards(1);
        }),
      )
      .from(
        new ActionChoice('+1 Action', () => {
          ie.addActions(1);
        }),
      )
      .from(
        new ActionChoice('+1 Buy', () => {
          ie.addBuys(1);
        }),
      )
      .from(
        new ActionChoice('+ $1', () => {
          return ie.addCoins(1);
        }),
      )
      .choose(2);
  }
}
