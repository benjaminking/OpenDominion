import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { Hex } from '../../card/Hex';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Haunting: If you have at least 4 cards in hand, put one of them onto your deck.
export class Haunting extends Hex {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Haunting'));
  }

  public async receive(ie: InstructionExecutor): Promise<void> {
    if (ie.handSize() < 4) {
      return;
    }
    const cardToTopdeck: Card | Choice = await ie
      .chooseCard('Put a card from your hand onto your deck')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TOPDECK)
      .choose();
    if (cardToTopdeck instanceof Card) {
      await ie.topDeckCardFromLocation(cardToTopdeck, CardLocation.HAND);
    }
  }
}
