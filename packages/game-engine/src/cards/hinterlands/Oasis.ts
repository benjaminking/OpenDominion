import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Oasis extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Oasis'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    await ie.addCoins(1);

    const cardToDiscard: Card | Choice = await ie
      .chooseCard('Choose a card to discard')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .choose();
    if (cardToDiscard instanceof Card) {
      await ie.discardCardFromLocation(cardToDiscard, CardLocation.HAND);
    }
  }
}
