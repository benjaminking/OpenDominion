import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { costsAtLeast } from '../../StandardCardEligibilityFunctions';

export class Sage extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sage'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);

    const revealedCard: CardCollection = await ie.revealUntil(costsAtLeast(Cost.Simple(3)), 1);
    ie.putCardsIntoHandFromLocation(revealedCard, CardLocation.REVEAL_LIMBO);
  }
}
