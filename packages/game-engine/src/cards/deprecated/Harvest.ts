import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Harvest (Action): Reveal the top 4 cards of your deck, then discard them.
// +$1 per differently named card revealed.
export class Harvest extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Harvest'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const topCards = await ie.takeCardsOffDeck(4);
    await ie.revealCards(topCards);
    const uniqueNames = new Set<string>();
    for (const card of topCards) {
      uniqueNames.add(card.getName());
    }
    await ie.discardCards(topCards, CardLocation.REVEAL_LIMBO);
    await ie.addCoins(uniqueNames.size);
  }
}
