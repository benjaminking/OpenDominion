import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';

// Followers (Action/Attack/Reward, non-supply): +2 Cards. Gain an Estate.
// Each other player gains a Curse and discards down to 3 cards in hand.
export class Followers extends Card {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Followers'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);
    await ie.gainCardFromPile('Estate');
    await ie.performAttack(this, this.attack.bind(this));
  }

  private async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const attackedIe = attackedPlayer.getInstructionExecutor();
    await attackedIe.gainCardFromPile('Curse');
    await attackedIe.discardDownTo(3);
  }
}
