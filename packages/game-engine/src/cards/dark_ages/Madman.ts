import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Madman extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Madman'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(2);
    await ie.returnCardToOwnPile(this, CardLocation.IN_PLAY);
    // Draw 1 card per card in hand; returning to pile is stubbed so we always draw here
    const handSize = ie.handSize();
    if (handSize > 0) {
      await ie.drawCards(handSize);
    }
  }
}
