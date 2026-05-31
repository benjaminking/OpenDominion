import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo } from '../../StandardCardEligibilityFunctions';
import { KnightCard } from './KnightCard';

export class DameNatalie extends KnightCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Dame Natalie'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    // Gain a card costing up to $3
    const card: Card | Choice = await ie
      .chooseCard('Gain a card costing up to $3')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsUpTo(Cost.Simple(3)))
      .allowNoneOption()
      .choose();
    if (card instanceof Card) {
      await ie.gainCardFromPile(card);
    }

    await ie.performAttack(this, this.knightAttack.bind(this));
  }
}
