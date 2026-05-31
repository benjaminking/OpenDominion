import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { Cost } from '../../card/Cost';
import { Event } from '../../card/Event';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo, isVictoryCard } from '../../StandardCardEligibilityFunctions';

const isNotVictoryCard = new CardEligibilityFunction((card) => !isVictoryCard.matches(card));

export class Banquet extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Banquet'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // Gain 2 Coppers
    await ie.gainCardFromPile('Copper');
    await ie.gainCardFromPile('Copper');

    // Gain a non-Victory card costing up to $5
    const cardToGain: Card | Choice = await ie
      .chooseCard('Gain a non-Victory card costing up to $5')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(isNotVictoryCard)
      .whereCardIs(costsUpTo(Cost.Simple(5)))
      .choose();
    if (cardToGain instanceof Card) {
      await ie.gainCardFromPile(cardToGain);
    }
  }
}
