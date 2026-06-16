import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { both, cardNameIs, isActionCard, not } from '../../StandardCardEligibilityFunctions';

export class Golem extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Golem'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const actions = await ie.revealUntil(both(isActionCard, not(cardNameIs('Golem'))), 2);
    await ie.playMultipleCardsFromLocation(actions, CardLocation.REVEAL_LIMBO);
  }
}
