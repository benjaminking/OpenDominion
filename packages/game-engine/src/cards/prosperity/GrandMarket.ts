import { CardInfoLookup } from '@dominion/card-info';

import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { cardNameIs } from '../../StandardCardEligibilityFunctions';

export class GrandMarket extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Grand Market'));
  }

  public override canBeBought(ie: InstructionExecutor): boolean {
    return !ie.hasMatchingCardInPlay(cardNameIs('Copper'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    await ie.drawCards(1);
    ie.addActions(1);
    ie.addBuys(1);
    await ie.addCoins(2);
  }
}
