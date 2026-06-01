import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsUpTo } from '../../StandardCardEligibilityFunctions';
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class Displace extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Displace'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const cards = await ie
      .chooseCards('Exile a card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.OTHER)
      .whereNumCardsIs(exactlyNChecked(1))
      .choose();

    if (cards.isEmpty()) {
      return;
    }

    const exiled = cards.getArbitraryCard();
    await ie.exileCardFromLocation(exiled, CardLocation.HAND);

    const gainChoice = await ie
      .chooseCard('Gain a differently named card costing up to $2 more than it')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsUpTo(Cost.Simple(exiled.getCost().coins + 2)))
      .choose();

    if (gainChoice instanceof Card && gainChoice.getName() !== exiled.getName()) {
      await ie.gainCardFromPile(gainChoice);
    }
  }
}
