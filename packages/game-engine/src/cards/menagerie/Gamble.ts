import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { ActionChoice } from '../../decisions/ActionChoice';
import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { either, isActionCard, isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class Gamble extends Event {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Gamble'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);

    const top = await ie.takeCardOffDeck();
    if (top === undefined) {
      return;
    }

    await ie.discardCard(top);
    if (!either(isActionCard, isTreasureCard).matches(top)) {
      return;
    }

    await ie
      .chooseOneOption('You may play it')
      .from(
        new ActionChoice('Play it', async () => {
          await ie.playCardFromLocation(top, CardLocation.DISCARD);
        }),
      )
      .from(new ActionChoice('Skip', async () => Promise.resolve()))
      .choose();
  }
}
