import { CardInfoLookup } from '@dominion/card-info';
import { CardType } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { anyCard } from '../../StandardCardEligibilityFunctions';

export class Rice extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Rice'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);
    const typesInPlay = new Set<CardType>();
    for (const card of ie.getMatchingCardsInPlay(anyCard)) {
      for (const type of card.getTypes()) {
        typesInPlay.add(type);
      }
    }
    await ie.addCoins(typesInPlay.size);
  }
}
