import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class Sibyl extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sibyl'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(4);
    ie.addActions(1);

    const topChoice = await ie
      .chooseCards('Choose a card from your hand to put on top of your deck')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TOPDECK)
      .whereNumCardsIs(upToNChecked(1))
      .choose();
    if (!topChoice.isEmpty()) {
      await ie.topDeckCardFromLocation(topChoice.getArbitraryCard(), CardLocation.HAND);
    }

    const bottomChoice = await ie
      .chooseCards('Choose another card from your hand to put on bottom of your deck')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.BOTTOMDECK)
      .whereNumCardsIs(upToNChecked(1))
      .choose();
    if (!bottomChoice.isEmpty()) {
      ie.putCardOnBottomOfDeckFromLocation(bottomChoice.getArbitraryCard(), CardLocation.HAND);
    }
  }
}
