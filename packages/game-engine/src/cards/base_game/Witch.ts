import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';

export class Witch extends KingdomCard {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Witch'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);
    await ie.performAttack(this, this.attack.bind(this));
  }

  public async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const ie = attackedPlayer.getInstructionExecutor();
    await ie.gainCardFromPile('Curse');
  }
}
