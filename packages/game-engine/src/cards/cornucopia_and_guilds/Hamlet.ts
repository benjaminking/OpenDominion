import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { anyCard } from '../../StandardCardEligibilityFunctions';

export class Hamlet extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Hamlet'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);

    // You may discard a card for +1 Action
    const forAction: Card | Choice = await ie
      .chooseCard('You may discard a card for +1 Action')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereCardIs(anyCard)
      .allowNoneOption()
      .choose();
    if (forAction instanceof Card) {
      await ie.discardCardFromLocation(forAction, CardLocation.HAND);
      ie.addActions(1);
    }

    // You may discard a card for +1 Buy
    const forBuy: Card | Choice = await ie
      .chooseCard('You may discard a card for +1 Buy')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .whereCardIs(anyCard)
      .allowNoneOption()
      .choose();
    if (forBuy instanceof Card) {
      await ie.discardCardFromLocation(forBuy, CardLocation.HAND);
      ie.addBuys(1);
    }
  }
}
