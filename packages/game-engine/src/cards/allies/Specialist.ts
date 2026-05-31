import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { either, isActionCard, isTreasureCard } from '../../StandardCardEligibilityFunctions';
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class Specialist extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Specialist'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cards = await ie
      .chooseCards('You may play an Action or Treasure from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.PLAY)
      .whereCardIs(either(isActionCard, isTreasureCard))
      .whereNumCardsIs(exactlyNChecked(1))
      .choose();

    if (cards.isEmpty()) {
      return;
    }

    const chosen = cards.getArbitraryCard();
    await ie.playCardFromHand(chosen);

    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('Play it again', async () => {
          await ie.replayCardInPlay(chosen);
        }),
      )
      .from(
        new ActionChoice('Gain a copy of it', async () => {
          await ie.gainFromPile(chosen.getPileName());
        }),
      )
      .choose();
  }
}
