import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Pilgrim extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Pilgrim'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(4);

    const cardToTopDeck: Card | Choice = await ie
      .chooseCard('Choose a card to put onto your deck')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.TOPDECK)
      .choose();
    if (cardToTopDeck instanceof Card) {
      await ie.topDeckCardFromLocation(cardToTopDeck, CardLocation.HAND);
    }
  }
}
