import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Marquis extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Marquis'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);
    const handSize = ie.getCardsFromLocation(CardLocation.HAND).size();
    await ie.drawCards(handSize);
    await ie.discardDownTo(10);
  }
}
