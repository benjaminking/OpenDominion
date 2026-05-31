import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { Boon } from '../../card/Boon';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class TheSkysGift extends Boon {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo("The Sky's Gift"));
  }

  public async receive(ie: InstructionExecutor): Promise<void> {
    await ie
      .chooseOneOption('Do you want to discard 3 cards to gain a Gold?')
      .from(
        new ActionChoice('Yes, discard 3 cards', async () => {
          const cardsToDiscard: CardCollection = await ie
            .chooseCards('Choose 3 cards to discard')
            .from(CardLocation.HAND)
            .to(CardSelectionPurpose.DISCARD)
            .whereNumCardsIs(exactlyNChecked(3))
            .choose();
          await ie.discardCardsFromLocation(cardsToDiscard, CardLocation.HAND);
          await ie.gainFromPile('Gold');
        }),
      )
      .from(new ActionChoice('No', () => {}))
      .choose();
  }
}
