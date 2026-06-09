import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

export class ThroneRoom extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Throne Room'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const choice = await ie
      .chooseCard('Choose a card to play twice')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.PLAY_ALT)
      .whereCardIs(isActionCard)
      .allowNoneOption()
      .choose();

    if (choice instanceof Card) {
      await ie.playCardFromHandNTimes(choice, 2);
    }
  }
}
