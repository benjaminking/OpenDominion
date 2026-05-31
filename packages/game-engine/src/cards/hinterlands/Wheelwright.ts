import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { both, costsUpTo, isActionCard } from '../../StandardCardEligibilityFunctions';

export class Wheelwright extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Wheelwright'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);

    const discardedCard: Card | Choice = await ie
      .chooseCard('You may discard a card to gain an Action card')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .allowNoneOption()
      .choose();

    if (!(discardedCard instanceof Card)) {
      return;
    }

    await ie.discardCardFromLocation(discardedCard, CardLocation.HAND);

    const actionToGain: Card | Choice = await ie
      .chooseCard('Choose an Action card costing up to ' + discardedCard.getCost().toString() + ' to gain')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(both(isActionCard, costsUpTo(discardedCard.getCost())))
      .allowNoneOption()
      .choose();

    if (actionToGain instanceof Card) {
      await ie.gainCardFromPile(actionToGain);
    }
  }
}
