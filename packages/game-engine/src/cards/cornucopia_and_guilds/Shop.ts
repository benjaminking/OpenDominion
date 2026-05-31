import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { both, isActionCard } from '../../StandardCardEligibilityFunctions';

// Shop: +1 Card, +$1; play an Action card from your hand that you don't have a copy of in play
export class Shop extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Shop'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    await ie.addCoins(1);

    // Play an Action from hand that you don't already have a copy of in play
    const notAlreadyInPlay = new CardEligibilityFunction(
      (c: Card) =>
        !ie.hasMatchingCardInPlay(
          new CardEligibilityFunction((p: Card) => p.getName().toLowerCase() === c.getName().toLowerCase()),
        ),
    );
    const eligibleAction: Card | Choice = await ie
      .chooseCard("You may play an Action you don't have a copy of in play")
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.PLAY_ALT)
      .whereCardIs(both(isActionCard, notAlreadyInPlay))
      .allowNoneOption()
      .choose();
    if (eligibleAction instanceof Card) {
      await ie.playCardFromHand(eligibleAction);
    }
  }
}
