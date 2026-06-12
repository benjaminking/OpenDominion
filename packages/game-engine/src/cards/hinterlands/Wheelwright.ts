import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { both, costsTheSameOrLessThanCard, isActionCard } from '../../StandardCardEligibilityFunctions';

export class Wheelwright extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Wheelwright'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);

    const cardToDiscard: Card | Choice = await ie
      .chooseCard('You may discard a card to gain an Action card costing as much or less than it')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .allowNoneOption()
      .choose();

    if (!(cardToDiscard instanceof Card)) {
      return;
    }

    const discardedCard: Card | undefined = await ie.discardCardFromLocation(cardToDiscard, CardLocation.HAND);
    if (discardedCard === undefined) {
      return;
    }

    const actionToGain: Card | Choice = await ie
      .chooseCard('Choose an Action card costing up to ' + discardedCard.getCost().toString() + ' to gain')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(both(isActionCard, costsTheSameOrLessThanCard(discardedCard)))
      .choose();

    if (actionToGain instanceof Card) {
      await ie.gainCardFromPile(actionToGain);
    }
  }
}
