import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { both, isActionCard, costsUpTo } from '../../StandardCardEligibilityFunctions';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class Swap extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Swap'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);

    await ie
      .chooseOneOption('You may return an Action from your hand to its pile to gain a different Action to your hand')
      .from(
        new ActionChoice('Do the swap', async () => {
          const toReturn = await ie
            .chooseCards('Choose an Action card to return to its pile')
            .from(CardLocation.HAND)
            .to(CardSelectionPurpose.OTHER)
            .whereCardIs(isActionCard)
            .whereNumCardsIs(upToNChecked(1))
            .choose();

          if (toReturn.isEmpty()) {
            return;
          }

          const returned = toReturn.getArbitraryCard();
          ie.returnCardToPile(returned);

          const gainChoice = await ie
            .chooseCard('Gain a different Action card costing up to $5 to your hand')
            .from(CardSelectionLocation.SUPPLY)
            .to(CardSelectionPurpose.GAIN)
            .whereCardIs(both(isActionCard, costsUpTo(Cost.Simple(5))))
            .choose();
          if (gainChoice instanceof Card && gainChoice.getName() !== returned.getName()) {
            await ie.gainCardFromPile(gainChoice, CardLocation.HAND);
          }
        }),
      )
      .from(new ActionChoice('Skip', async () => Promise.resolve()))
      .choose();
  }
}
