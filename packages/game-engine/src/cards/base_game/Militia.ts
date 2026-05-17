import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { SharedGameState } from '../../SharedGameState';

export class Militia extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Militia'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.addCoins(2);
    await ie.performAttack(this, this.attack.bind(this));
  }

  public async attack(attackedPlayer: Player, _attackingPlayer: Player): Promise<void> {
    const ie = attackedPlayer.getInstructionExecutor();
    return ie.discardDownTo(3);
  }
}
