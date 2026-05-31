import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { Event } from '../../card/Event';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo } from '../../StandardCardEligibilityFunctions';

export class Ball extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Ball'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // Take your -$1 token. Gain 2 cards each costing up to $4.
    ie.giveMinusDollarToken(ie.getSharedGameState().getCurrentPlayer());
    for (let i = 0; i < 2; i++) {
      const cardToGain: Card | Choice = await ie
        .chooseCard('Gain a card costing up to $4')
        .from(CardSelectionLocation.SUPPLY)
        .to(CardSelectionPurpose.GAIN)
        .whereCardIs(costsUpTo(Cost.Simple(4)))
        .allowNoneOption()
        .choose();
      if (cardToGain instanceof Card) {
        await ie.gainCardFromPile(cardToGain);
      }
    }
  }
}
