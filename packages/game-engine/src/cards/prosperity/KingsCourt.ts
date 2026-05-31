import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

export class KingsCourt extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo("King's Court"));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const choice = await ie
      .chooseCard('Choose a card to play three times')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.PLAY_ALT)
      .whereCardIs(isActionCard)
      .allowNoneOption()
      .choose();

    if (choice instanceof Card) {
      await ie.playCardFromHandNTimes(choice, 3);
    }
  }
}
