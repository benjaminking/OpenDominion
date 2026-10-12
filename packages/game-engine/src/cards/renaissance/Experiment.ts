import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Experiment extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Experiment'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);
    ie.addActions(1);
    // Return this card to its supply pile.
    ie.returnCardToPileFromLocation(this, CardLocation.IN_PLAY);
  }
}
