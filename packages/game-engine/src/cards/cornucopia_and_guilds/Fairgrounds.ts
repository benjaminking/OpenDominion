import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isVictoryCard } from '../../StandardCardEligibilityFunctions';

// Fairgrounds: Worth 2VP per 5 differently named cards you have (rounded down).
export class Fairgrounds extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Fairgrounds'));
  }

  public async play(_ie: InstructionExecutor): Promise<void> {
    // No play effect
  }

  public score(allCardGroups: CardCollection[]): number {
    const names = new Set<string>();
    for (const collection of allCardGroups) {
      for (const card of collection.asCardArray()) {
        names.add(card.getName());
      }
    }
    return Math.floor(names.size / 5) * 2;
  }
}
