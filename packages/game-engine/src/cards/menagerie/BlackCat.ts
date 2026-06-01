import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class BlackCat extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Black Cat'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(2);
    // TODO: Reaction timing (if it's not your turn) is not wired yet.
    await ie.eachOtherPlayer(async (otherIe: InstructionExecutor) => {
      await otherIe.gainFromPile('Curse');
    });
  }
}
