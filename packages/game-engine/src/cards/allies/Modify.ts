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
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class Modify extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Modify'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const trashedCards = await ie
      .chooseCards('Trash a card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereNumCardsIs(exactlyNChecked(1))
      .choose();

    if (trashedCards.isEmpty()) {
      return;
    }

    const trashed = trashedCards.getArbitraryCard();
    await ie.trashCardFromLocation(trashed, CardLocation.HAND);

    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('+1 Card and +1 Action', async () => {
          await ie.drawCards(1);
          ie.addActions(1);
        }),
      )
      .from(
        new ActionChoice('Gain a card costing up to $2 more', async () => {
          const gainChoice = await ie
            .chooseCard('Gain a card')
            .from(CardSelectionLocation.SUPPLY)
            .to(CardSelectionPurpose.GAIN)
            .whereCardIs(costsUpTo(Cost.Simple(trashed.getCost().coins + 2)))
            .choose();
          if (gainChoice instanceof Card) {
            await ie.gainCardFromPile(gainChoice);
          }
        }),
      )
      .choose();
  }
}
