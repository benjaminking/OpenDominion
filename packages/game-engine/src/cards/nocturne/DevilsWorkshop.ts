import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { anyCard, costsUpTo } from '../../StandardCardEligibilityFunctions';

// Devil's Workshop (Night): If you gained 2+ cards this turn: gain an Imp.
// If you gained exactly 1: gain a card costing up to $4.
// If you gained 0: gain a Gold.
export class DevilsWorkshop extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo("Devil's Workshop"));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const numGained = ie.numMatchingCardsGainedThisTurn(anyCard);
    if (numGained >= 2) {
      await ie.gainFromSpiritPile('Imp');
    } else if (numGained === 1) {
      const cardToGain: Card | Choice = await ie
        .chooseCard('Gain a card costing up to $4')
        .from(CardSelectionLocation.SUPPLY)
        .to(CardSelectionPurpose.GAIN)
        .whereCardIs(costsUpTo(Cost.Simple(4)))
        .choose();
      if (cardToGain instanceof Card) {
        await ie.gainCardFromPile(cardToGain);
      }
    } else {
      await ie.gainFromPile('Gold');
    }
  }
}
