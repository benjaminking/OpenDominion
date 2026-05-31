import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class CapitalCity extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Capital City'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(2);

    await ie
      .chooseOneOption('You may discard 2 cards for +$2')
      .from(
        new ActionChoice('Discard 2 cards for +$2', async () => {
          const discarded = await ie
            .chooseCards('Choose 2 cards to discard')
            .from(CardLocation.HAND)
            .to(CardSelectionPurpose.DISCARD)
            .whereNumCardsIs(exactlyNChecked(2))
            .choose();
          await ie.discardCardsFromLocation(discarded, CardLocation.HAND);
          ie.addCoins(2);
        }),
      )
      .from(new ActionChoice('Skip', async () => Promise.resolve()))
      .choose();

    await ie
      .chooseOneOption('You may pay $2 for +2 Cards')
      .from(
        new ActionChoice('Pay $2 for +2 Cards', async () => {
          if (ie.payCoins(2)) {
            await ie.drawCards(2);
          }
        }),
      )
      .from(new ActionChoice('Skip', async () => Promise.resolve()))
      .choose();
  }
}
