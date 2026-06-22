import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';

// Soothsayer: Gain a Gold. Each other player gains a Curse; if they do,
// they draw a card.
export class Soothsayer extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Soothsayer'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.gainFromPile('Gold');
    await ie.performAttack(this, this.attack.bind(this));
  }

  private async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const attackedIe: InstructionExecutor = attackedPlayer.getInstructionExecutor();
    const curse: Card | undefined = await attackedIe.gainFromPile('Curse');
    if (curse !== undefined) {
      await attackedIe.drawCards(1);
    }
  }
}
