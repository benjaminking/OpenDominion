import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class Innkeeper extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Innkeeper'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);

    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('+1 Card', async () => {
          await ie.drawCards(1);
        }),
      )
      .from(
        new ActionChoice('+3 Cards, then discard 3 cards', async () => {
          await ie.drawCards(3);
          const toDiscard = await ie
            .chooseCards('Choose 3 cards to discard')
            .from(CardLocation.HAND)
            .to(CardSelectionPurpose.DISCARD)
            .whereNumCardsIs(exactlyNChecked(3))
            .choose();
          await ie.discardCardsFromLocation(toDiscard, CardLocation.HAND);
        }),
      )
      .from(
        new ActionChoice('+5 Cards, then discard 6 cards', async () => {
          await ie.drawCards(5);
          const toDiscard = await ie
            .chooseCards('Choose 6 cards to discard')
            .from(CardLocation.HAND)
            .to(CardSelectionPurpose.DISCARD)
            .whereNumCardsIs(exactlyNChecked(6))
            .choose();
          await ie.discardCardsFromLocation(toDiscard, CardLocation.HAND);
        }),
      )
      .choose();
  }
}
