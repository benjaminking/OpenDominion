import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation } from '@dominion/common';

import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { Player } from '../../players/Player';
import { Knights } from './Knights';

export class SirMichael extends Knights {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Sir Michael'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const selfExpectation = ie.createLocationExpectation(CardLocation.IN_PLAY);
    await ie.performAttack(this, async (attackedPlayer: Player, _attackingPlayer: Player) => {
      await attackedPlayer.getInstructionExecutor().discardDownTo(3);
    });
    await this.performKnightAttack(ie, selfExpectation);
  }
}
