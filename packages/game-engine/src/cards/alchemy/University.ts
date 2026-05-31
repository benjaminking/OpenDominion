import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { both, costsUpTo, isActionCard } from '../../StandardCardEligibilityFunctions';

export class University extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('University'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(2);

    const actionCardToGain: Card | Choice = await ie
      .chooseCard('You may gain an Action card costing up to $5')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(both(isActionCard, costsUpTo(Cost.Simple(5))))
      .allowNoneOption()
      .choose();
    if (actionCardToGain instanceof Card) {
      await ie.gainCardFromPile(actionCardToGain);
    }
  }
}
