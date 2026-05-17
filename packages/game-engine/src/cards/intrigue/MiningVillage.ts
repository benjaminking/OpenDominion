import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class MiningVillage extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Mining Village'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(2);

    await ie
      .chooseOneOption('Do you want to trash this Mining Village for +$2?')
      .from(
        new ActionChoice('Yes', async () => {
          const trashedCard: Card | undefined = await ie.trashCardFromLocation(this, CardLocation.IN_PLAY);
          if (trashedCard !== undefined) {
            await ie.addCoins(2);
          }
        }),
      )
      .from(
        new ActionChoice('No', () => {
          //
        }),
      )
      .choose();
  }
}
