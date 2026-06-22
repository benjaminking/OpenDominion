import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { both, isActionCard } from '../../StandardCardEligibilityFunctions';

export class Shop extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Shop'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    await ie.addCoins(1);

    const eligibleAction: Card | Choice = await ie
      .chooseCard("You may play an Action you don't have a copy of in play")
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.PLAY_ALT)
      .whereCardIs(both(isActionCard, ie.createIsNotDuplicateWithInPlayCardEligibilityFunction()))
      .allowNoneOption()
      .choose();
    if (eligibleAction instanceof Card) {
      await ie.playCardFromHand(eligibleAction);
    }
  }
}
