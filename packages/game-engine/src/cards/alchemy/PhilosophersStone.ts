import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';

export class PhilosophersStone extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo("Philosopher's Stone"));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const currentPlayerCards = ie.getSharedGameState().getCurrentPlayer().getOwnedCards();
    const totalCards = currentPlayerCards.getDeck().size() + currentPlayerCards.getDiscard().size();
    await ie.addCoins(Math.floor(totalCards / 5));
  }
}
