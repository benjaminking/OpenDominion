import { CardInfoLookup } from '@dominion/card-info';

import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { KnightCard } from './KnightCard';

export class SirMichael extends KnightCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sir Michael'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.performAttack(this, async (attackedPlayer, _attackingPlayer) => {
      await attackedPlayer.getInstructionExecutor().discardDownTo(3);
      await this.knightAttack(attackedPlayer, _attackingPlayer);
    });
  }
}
