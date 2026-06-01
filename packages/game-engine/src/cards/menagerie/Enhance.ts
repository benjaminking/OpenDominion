import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, CardType } from '@dominion/common';

import { Card } from '../../card/Card';
import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { Cost } from '../../card/Cost';
import { Event } from '../../card/Event';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { both, costsUpTo } from '../../StandardCardEligibilityFunctions';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

class IsNotVictoryCard extends CardEligibilityFunction {
  constructor() {
    super((card: Card) => !card.hasType(CardType.VICTORY));
  }
}

const isNotVictoryCard = new IsNotVictoryCard();

export class Enhance extends Event {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Enhance'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    const cards = await ie
      .chooseCards('You may trash a non-Victory card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TRASH)
      .whereCardIs(isNotVictoryCard)
      .whereNumCardsIs(upToNChecked(1))
      .choose();

    if (cards.isEmpty()) {
      return;
    }

    const trashed = cards.getArbitraryCard();
    await ie.trashCardFromLocation(trashed, CardLocation.HAND);

    const gainChoice = await ie
      .chooseCard('Gain a card costing up to $2 more than it')
      .from(CardSelectionLocation.SUPPLY)
      .to(CardSelectionPurpose.GAIN)
      .whereCardIs(costsUpTo(Cost.Simple(trashed.getCost().coins + 2)))
      .choose();

    if (gainChoice instanceof Card) {
      await ie.gainCardFromPile(gainChoice);
    }
  }
}
