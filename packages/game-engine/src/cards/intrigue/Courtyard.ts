import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Courtyard extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Courtyard'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(3);
    const cardToTopdeck = await ie
      .chooseCard('Choose a card to put on top of your deck')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TOPDECK)
      .choose();
    if (cardToTopdeck instanceof Card) {
      await ie.topDeckCardFromLocation(cardToTopdeck, CardLocation.HAND);
    }
  }
}
