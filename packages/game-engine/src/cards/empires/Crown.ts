import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard, isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class Crown extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Crown'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    if (ie.isActionPhase()) {
      const choice: Card | Choice = await ie
        .chooseCard('Choose an Action card to play twice')
        .from(CardLocation.HAND)
        .to(CardSelectionPurpose.PLAY_ALT)
        .whereCardIs(isActionCard)
        .allowNoneOption()
        .choose();
      if (choice instanceof Card) {
        await ie.playCardFromHandNTimes(choice, 2);
      }
    } else {
      // Buy phase
      const choice: Card | Choice = await ie
        .chooseCard('Choose a Treasure card to play twice')
        .from(CardLocation.HAND)
        .to(CardSelectionPurpose.PLAY_ALT)
        .whereCardIs(isTreasureCard)
        .allowNoneOption()
        .choose();
      if (choice instanceof Card) {
        await ie.playCardFromHandNTimes(choice, 2);
      }
    }
  }
}
