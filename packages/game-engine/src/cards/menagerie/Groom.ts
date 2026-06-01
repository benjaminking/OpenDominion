import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose, CardType } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo } from '../../StandardCardEligibilityFunctions';

export class Groom extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Groom'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const choice = await ie
      .chooseCard('Gain a card costing up to $4')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsUpTo(Cost.Simple(4)))
      .choose();

    if (!(choice instanceof Card)) {
      return;
    }

    await ie.gainCardFromPile(choice);

    if (choice.hasType(CardType.ACTION)) {
      await ie.gainHorse(1);
    }
    if (choice.hasType(CardType.TREASURE)) {
      await ie.gainFromPile('Silver');
    }
    if (choice.hasType(CardType.VICTORY)) {
      await ie.drawCards(1);
      ie.addActions(1);
    }
  }
}
