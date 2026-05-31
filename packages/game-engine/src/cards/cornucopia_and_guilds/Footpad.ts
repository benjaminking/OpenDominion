import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';

// Footpad: +2 Coffers. Each other player discards down to 3 cards in hand.
// When you gain a card in an Action phase, +1 Card. (global passive is a stub)
export class Footpad extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Footpad'));
    // TODO: global "when any player gains a card in Action phase, +1 Card" passive
    // requires game-phase tracking not yet implemented.
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    // TODO: addCoffers stub
    ie.addCoffers(2);
    await ie.performAttack(this, this.attack.bind(this));
  }

  private async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const attackedIe: InstructionExecutor = attackedPlayer.getInstructionExecutor();
    await attackedIe.discardDownTo(3);
  }
}
