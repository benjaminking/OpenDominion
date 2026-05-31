import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Card } from '../../card/Card';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Bag of Gold (Action/Reward, non-supply): +1 Action. Gain a Gold onto your deck.
export class BagofGold extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Bag of Gold'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);
    await ie.gainCardFromPile('Gold', CardLocation.DECK);
  }
}
