import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class Broker extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Broker'));
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

    const amount = Math.max(0, trashed.getCost().coins);
    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('+' + amount.toFixed() + ' Cards', async () => {
          await ie.drawCards(amount);
        }),
      )
      .from(
        new ActionChoice('+' + amount.toFixed() + ' Actions', async () => {
          ie.addActions(amount);
        }),
      )
      .from(
        new ActionChoice('+$' + amount.toFixed(), async () => {
          ie.addCoins(amount);
        }),
      )
      .from(
        new ActionChoice('+' + amount.toFixed() + ' Favors', async () => {
          ie.addFavors(amount);
        }),
      )
      .choose();
  }
}
