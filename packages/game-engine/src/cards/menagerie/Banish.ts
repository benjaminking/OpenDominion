import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { upToNChecked } from '../../StandardNumberEligibilityFunctions';

export class Banish extends Event {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Banish'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    const cards = await ie
      .chooseCards('Exile any number of cards with the same name from your hand')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.OTHER)
      .whereNumCardsIs(upToNChecked(ie.handSize()))
      .choose();

    if (cards.isEmpty()) {
      return;
    }

    const firstName = cards.getArbitraryCard().getName();
    for (const card of cards) {
      if (card.getName() === firstName) {
        await ie.exileCardFromLocation(card, CardLocation.HAND);
      }
    }
  }
}
