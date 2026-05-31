import { CardInfoLookup } from '@dominion/card-info';

import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Triumph extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Triumph'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // Gain an Estate; if you did, +1VP per card you've gained this turn
    const gained = await ie.gainCardFromPile('Estate');
    if (gained !== undefined) {
      const cardsGained = ie.getNumCardsGainedThisTurn();
      ie.addVP(cardsGained);
    }
  }
}
