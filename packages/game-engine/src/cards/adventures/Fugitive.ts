import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardSelectionPurpose, Choice } from '@dominion/common';

import { Card } from '../../card/Card';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Fugitive extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Fugitive'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);
    ie.addActions(1);
    const cardToDiscard: Card | Choice = await ie
      .chooseCard('Discard a card')
      .from(CardLocation.HAND)
      .to(CardSelectionPurpose.DISCARD)
      .choose();
    if (cardToDiscard instanceof Card) {
      await ie.discardCardFromLocation(cardToDiscard, CardLocation.HAND);
    }
  }
}
