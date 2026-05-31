import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

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
      const namedCard = await leftIe.chooseCardByName('Name a card that cannot be bought');
      if (namedCard !== '') {
        ie.addBuyRestriction(namedCard);
      }
    });
    // TODO: addBuyRestriction is a stub — buy restriction not yet enforced
  }
}
