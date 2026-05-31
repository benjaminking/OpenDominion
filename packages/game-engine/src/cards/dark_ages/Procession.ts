import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { both, costsExactly, isActionCard, not, isDurationCard } from '../../StandardCardEligibilityFunctions';

export class Procession extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Procession'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const choice: Card | Choice = await ie
      .chooseCard('Choose a non-Duration Action card from your hand to play twice')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.PLAY_ALT)
      .whereCardIs(both(isActionCard, not(isDurationCard)))
      .allowNoneOption()
      .choose();

    if (!(choice instanceof Card)) {
      return;
    }

    const cardCost = choice.getCost();
    await ie.playCardFromHandNTimes(choice, 2);
    await ie.trashCardFromLocation(choice, CardLocation.IN_PLAY);

    const cardToGain: Card | Choice = await ie
      .chooseCard('Gain an Action card costing exactly $' + cardCost.plus(1).coins.toFixed())
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(both(isActionCard, costsExactly(cardCost.plus(1))))
      .allowNoneOption()
      .choose();
    if (cardToGain instanceof Card) {
      await ie.gainCardFromPile(cardToGain);
    }
  }
}
