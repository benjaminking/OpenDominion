import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class Student extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Student'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);

    await ie
      .chooseOneOption('You may rotate the Wizards')
      .from(
        new ActionChoice('Rotate Wizards', async () => {
          ie.rotatePileGroup('Wizards');
        }),
      )
      .from(new ActionChoice('Skip', async () => Promise.resolve()))
      .choose();

    const trashed = await ie
      .chooseCards('You may trash a card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereNumCardsIs(upToNChecked(1))
      .choose();
    if (!trashed.isEmpty()) {
      const card = trashed.getArbitraryCard();
      const wasTreasure = isTreasureCard.matches(card);
      await ie.trashCardFromLocation(card, CardLocation.HAND);
      if (wasTreasure) {
        ie.addFavors(1);
        await ie.topDeckCardFromLocation(this, CardLocation.IN_PLAY);
      }
    }
  }
}
