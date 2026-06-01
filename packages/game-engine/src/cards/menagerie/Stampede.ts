import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class Stampede extends Event {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Stampede'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    if (ie.getCardsFromLocation(CardLocation.IN_PLAY).size() <= 5) {
      await ie.gainHorse(5, CardLocation.DECK);
    }
  }
}
