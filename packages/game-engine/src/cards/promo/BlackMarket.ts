import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

// Black Market: +$2. Reveal the top 3 cards of the Black Market deck.
// Play any number of Treasures from your hand. You may buy one of the revealed cards.
// Put the rest on the bottom of the Black Market deck in any order.
// Stub: Black Market deck is a unique setup mechanic not yet in the engine.
export class BlackMarket extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Black Market'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
    // TODO: Draw 3 from Black Market deck, offer to buy one, return rest.
    // Requires Black Market deck setup mechanic.
  }
}
