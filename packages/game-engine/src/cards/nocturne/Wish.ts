import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo } from '../../StandardCardEligibilityFunctions';

// Wish (Action): +1 Action. Return this to its pile (if it's there).
// If you did, gain a card costing up to $6 to your hand.
export class Wish extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Wish'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    // TODO: Returning to Spirit pile requires engine support (exchangeCard / return to pile).
    // Approximated by gaining from supply ≤$6 to hand.
    const cardToGain: Card | Choice = await ie
      .chooseCard('Gain a card costing up to $6 to your hand')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsUpTo(Cost.Simple(6)))
      .choose();
    if (cardToGain instanceof Card) {
      await ie.gainCardFromPile(cardToGain.getPileName(), CardLocation.HAND);
    }
  }
}
