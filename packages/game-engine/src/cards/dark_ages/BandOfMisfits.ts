import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import {
  both,
  costsLessThanCard,
  isActionCard,
  isCommandCard,
  isDurationCard,
  not,
} from '../../StandardCardEligibilityFunctions';

export class BandOfMisfits extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Band Of Misfits'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const choice: Card | Choice = await ie
      .chooseCard('Choose a non-Command Action card from the Supply costing less than $5 to play')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.PLAY_ALT)
      .whereCardIs(both(both(isActionCard, both(not(isCommandCard), not(isDurationCard))), costsLessThanCard(this)))
      .choose();

    if (choice instanceof Card) {
      await ie.playCardFromSupplyLeavingItThere(choice);
    }
  }
}
