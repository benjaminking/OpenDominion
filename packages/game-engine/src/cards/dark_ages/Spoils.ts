import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Spoils extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Spoils'));
    this.setCoins(3);
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const locationExpectation = ie.createLocationExpectation(CardLocation.IN_PLAY);
    await ie.addCoins(3);
    // e.g. Counterfeit's second play: it already returned itself to its pile
    if (!locationExpectation.isMet(this)) {
      ie.sendLostTrackMessage(this);
      return;
    }
    ie.returnCardToPileFromLocation(this, CardLocation.IN_PLAY);
  }
}
