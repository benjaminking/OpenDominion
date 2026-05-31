import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { either, isActionCard, isVictoryCard } from '../../StandardCardEligibilityFunctions';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class Acolyte extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Acolyte'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const trashed = await ie
      .chooseCards('You may trash an Action or Victory card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereCardIs(either(isActionCard, isVictoryCard))
      .whereNumCardsIs(upToNChecked(1))
      .choose();

    if (!trashed.isEmpty()) {
      await ie.trashCardsFromLocation(trashed, CardLocation.HAND);
      await ie.gainFromPile('Gold');
    }

    await ie
      .chooseOneOption('You may trash this to gain an Augur')
      .from(
        new ActionChoice('Trash Acolyte to gain an Augur', async () => {
          await ie.trashCardFromLocation(this, CardLocation.IN_PLAY);
          await ie.gainFromPile('Augur');
        }),
      )
      .from(new ActionChoice('Do not trash Acolyte', async () => Promise.resolve()))
      .choose();
  }
}
