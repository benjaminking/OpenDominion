import { CardInfoLookup } from '@dominion/card-info';

import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Windfall extends Event {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Windfall'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    // If your deck and discard pile are both empty, gain 3 Golds
    const deckEmpty = ie.getSharedGameState().getCurrentPlayer().getOwnedCards().getDeck().isEmpty();
    const discardEmpty = ie.getSharedGameState().getCurrentPlayer().getOwnedCards().getDiscard().isEmpty();
    if (deckEmpty && discardEmpty) {
      await ie.gainCardFromPile('Gold');
      await ie.gainCardFromPile('Gold');
      await ie.gainCardFromPile('Gold');
    }
  }
}
