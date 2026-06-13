import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { ActionChoice } from '../../decisions/ActionChoice';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { isTreasureCard } from '../../StandardCardEligibilityFunctions';

export class SpiceMerchant extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Spice Merchant'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const treasureToTrash: Card | Choice = await ie
      .chooseCard('You may trash a Treasure from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereCardIs(isTreasureCard)
      .allowNoneOption()
      .choose();

    if (!(treasureToTrash instanceof Card)) {
      return;
    }

    await ie.trashCardFromLocation(treasureToTrash, CardLocation.HAND);
    await ie
      .chooseOneOption('Choose one:')
      .from(
        new ActionChoice('+2 Cards and +1 Action', async () => {
          await ie.drawCards(2);
          ie.addActions(1);
        }),
      )
      .from(
        new ActionChoice('+1 Buy and +$2', async () => {
          ie.addBuys(1);
          await ie.addCoins(2);
        }),
      )
      .choose();
  }
}
