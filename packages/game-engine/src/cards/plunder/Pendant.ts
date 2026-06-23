import { CardInfoLookup } from '@dominion/card-info';
import { CardType } from '@dominion/common';

import { CardEligibilityFunction } from '../../CardEligibilityFunction';
import { KingdomCard } from '../../card/KingdomCard';
import { SharedGameState } from '../../game-state/SharedGameState';
import { InstructionExecutor } from '../../players/InstructionExecutor';

const isTreasure = new CardEligibilityFunction((card) => card.hasType(CardType.TREASURE));

export class Pendant extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Pendant'));
  }

  public async play(ie: InstructionExecutor): Promise<void> {
    const treasureNamesInPlay = new Set<string>();
    for (const card of ie.getMatchingCardsInPlay(isTreasure)) {
      treasureNamesInPlay.add(card.getName());
    }
    await ie.addCoins(treasureNamesInPlay.size);
  }
}
