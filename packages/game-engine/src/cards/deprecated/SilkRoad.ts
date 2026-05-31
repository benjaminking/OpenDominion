import { CardInfoLookup } from '@dominion/card-info';
import { CardType } from '@dominion/common';

import { CardCollection } from '../../card/CardCollection';
import { KingdomCard } from '../../card/KingdomCard';
import { InstructionExecutor } from '../../players/InstructionExecutor';
import { SharedGameState } from '../../SharedGameState';
import { isVictoryCard } from '../../StandardCardEligibilityFunctions';

// Silk Road (Victory): Worth 1 VP for every 4 Victory cards you have.
export class SilkRoad extends KingdomCard {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Silk Road'));
  }

  public async play(_ie: InstructionExecutor): Promise<void> {
    // No action effect
  }

  public score(allCardGroups: CardCollection[]): number {
    let victoryCount = 0;
    for (const group of allCardGroups) {
      for (const card of group) {
        if (isVictoryCard.matches(card)) {
          victoryCount++;
        }
      }
    }
    return Math.floor(victoryCount / 4);
  }
}
