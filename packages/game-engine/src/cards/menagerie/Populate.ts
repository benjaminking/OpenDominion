import { CardInfoLookup } from '@dominion/card-info';

import { Event } from '../../card/Event';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isActionCard } from '../../StandardCardEligibilityFunctions';

export class Populate extends Event {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Populate'));
  }

  public async onBuy(ie: InstructionExecutor): Promise<void> {
    const topCards = ie.getTopSupplyCards().getMatchingCardsUnique(isActionCard);
    for (const card of topCards) {
      await ie.gainFromPile(card.getPileName());
    }
  }
}
