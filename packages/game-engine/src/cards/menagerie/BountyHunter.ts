import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { exactlyNChecked } from '../../StandardNumberEligibilityFunctions';

export class BountyHunter extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Bounty Hunter'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    const cards = await ie
      .chooseCards('Exile a card from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.OTHER)
      .whereNumCardsIs(exactlyNChecked(1))
      .choose();
    if (cards.isEmpty()) {
      return;
    }

    const card = cards.getArbitraryCard();
    const hadCopy = ie.hasExiledCopy(card.getName());
    await ie.exileCardFromLocation(card, CardLocation.HAND);
    if (!hadCopy) {
      ie.addCoins(3);
    }
  }
}
