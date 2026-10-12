import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

// Contraband (Treasure): $3. +1 Buy. When you play this, the player to your left names
// a card; you can't buy that card this turn.
export class Contraband extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Contraband'));
    this.setCoins(3);
    this.markAsSimpleTreasure();
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(3);
    ie.addBuys(1);
    await ie.performWithLeftPlayer(async (leftIe: InstructionExecutor) => {
      const namedCard = await leftIe.nameCard();
      if (namedCard instanceof Card) {
        ie.addBuyRestriction(namedCard.getName());
      }
    });
    // TODO: addBuyRestriction is a stub — buy restriction not yet enforced
  }
}
