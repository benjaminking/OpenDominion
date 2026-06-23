import { CardInfoLookup } from '@dominion/card-info';

import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

const anyCard = new CardEligibilityFunction(() => true);

export class SwampShacks extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Swamp Shacks'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    ie.addActions(2);
    await ie.drawCards(Math.floor(ie.getMatchingCardsInPlay(anyCard).size() / 3));
  }
}
