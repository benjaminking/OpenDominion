import { CardInfoLookup } from '@dominion/card-info';

import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { KnightCard } from './KnightCard';

export class DameMolly extends KnightCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Dame Molly'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(2);
    await ie.performAttack(this, this.knightAttack.bind(this));
  }
}
