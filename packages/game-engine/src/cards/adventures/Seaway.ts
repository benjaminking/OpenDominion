import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { Event } from '../../card/Event';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo, isActionCard } from '../../StandardCardEligibilityFunctions';
import { both } from '../../StandardCardEligibilityFunctions';

export class Seaway extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Seaway'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // Gain an Action card costing up to $4. Move your +1 Buy token to its pile (stub).
    const cardToGain: Card | Choice = await ie
      .chooseCard('Gain an Action card costing up to $4')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(both(isActionCard, costsUpTo(Cost.Simple(4))))
      .allowNoneOption()
      .choose();
    if (cardToGain instanceof Card) {
      await ie.gainCardFromPile(cardToGain);
      ie.applyPileToken(cardToGain.getPileName(), 'seaway');
    }
  }
}
