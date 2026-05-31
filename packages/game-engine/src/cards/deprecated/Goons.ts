import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';

// Goons (Action/Attack): +1 Buy, +$2. Each other player discards down to 3 cards in hand.
// When you buy a card, +1 VP token. (VP token mechanic not implemented)
export class Goons extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Goons'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addBuys(1);
    await ie.addCoins(2);
    await ie.performAttack(this, this.attack.bind(this));
    // TODO: When you buy a card, +1 VP token (VP token mechanic not implemented)
  }

  private async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    await attackedPlayer.getInstructionExecutor().discardDownTo(3);
  }
}
