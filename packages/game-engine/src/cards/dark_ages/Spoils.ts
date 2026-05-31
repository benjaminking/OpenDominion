import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Spoils extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Spoils'));
    this.setCoins(3);
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(3);
    await ie.returnCardToOwnPile(this, CardLocation.IN_PLAY);
  }
}
