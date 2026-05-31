import { CardInfoLookup } from '@dominion/card-info';
import { CardSelectionPurpose } from '@dominion/common';

import { Card } from '../../card/Card';
import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { costsAtLeast } from '../../StandardCardEligibilityFunctions';

export class Sage extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sage'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(1);

    let topCard = await ie.takeCardOffDeck();
    while (topCard !== undefined) {
      await ie.revealCard(topCard);
      if (costsAtLeast(Cost.Simple(3)).matches(topCard)) {
        ie.putCardIntoHandFromLocation(topCard, topCard.getLocation());
        break;
      }
      await ie.discardCard(topCard);
      topCard = await ie.takeCardOffDeck();
    }
  }
}
