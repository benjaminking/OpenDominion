import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Madman extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Madman'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(2);
    const returnedCard: Card | undefined = ie.returnCardToPileFromLocation(this, CardLocation.IN_PLAY);
    if (!(returnedCard instanceof Card)) {
      return;
    }

    const handSize = ie.handSize();
    if (handSize > 0) {
      await ie.drawCards(handSize);
    }
  }
}
