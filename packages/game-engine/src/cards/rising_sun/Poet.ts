import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { Cost } from '../../card/Cost';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

export class Poet extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Poet'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);
    await ie.drawCards(1);
    ie.addActions(1);

    const topCard = await ie.takeCardOffDeck();
    if (topCard === undefined) {
      return;
    }

    await ie.revealCard(topCard);
    if (topCard.getCost().isLessThanOrEqualTo(Cost.Simple(3))) {
      ie.putCardIntoHandFromLocation(topCard, CardLocation.REVEAL_LIMBO);
    } else {
      await ie.discardCardFromLocation(topCard, CardLocation.REVEAL_LIMBO);
    }
  }
}
