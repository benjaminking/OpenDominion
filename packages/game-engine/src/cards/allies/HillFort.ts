import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo } from '../../StandardCardEligibilityFunctions';

export class HillFort extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Hill Fort'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const gainChoice = await ie
      .chooseCard('Gain a card costing up to $4')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsUpTo(Cost.Simple(4)))
      .choose();

    if (!(gainChoice instanceof Card)) {
      return;
    }

    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('Put it into your hand', async () => {
          await ie.gainCardFromPile(gainChoice, CardLocation.HAND);
        }),
      )
      .from(
        new ActionChoice('+1 Card and +1 Action', async () => {
          await ie.gainCardFromPile(gainChoice);
          await ie.drawCards(1);
          ie.addActions(1);
        }),
      )
      .choose();
  }
}
