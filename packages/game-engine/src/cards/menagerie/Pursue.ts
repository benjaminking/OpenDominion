import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { Event } from '../../card/Event';
import { CardSelectionLocation } from '../../decisions/CardSelectionLocation';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Pursue extends Event {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Pursue'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);

    const named = await ie
      .chooseCard('Name a card')
      .from(CardSelectionLocation.ALL_CARDS)
      .to(CardSelectionPurpose.OTHER)
      .choose();

    const namedName = named instanceof Card ? named.getName() : '';
    const revealed = await ie.takeCardsOffDeck(4);
    await ie.revealCards(revealed);

    for (const card of revealed.clone()) {
      if (card.getName() === namedName) {
        await ie.topDeckCardFromLocation(card, card.getLocation(), true);
        revealed.removeCard(card);
      }
    }

    await ie.discardCardsFromLocation(revealed, CardLocation.REVEAL_LIMBO);
  }
}
