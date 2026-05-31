import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { Landmark } from '../../card/Landmark';
import { SharedGameState } from '../../SharedGameState';
import { isVictoryCard } from '../../StandardCardEligibilityFunctions';

export class Tower extends Landmark {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Tower'));
  }

  score(_allCardGroups: CardCollection[]): number {
    // TODO: 1 VP per non-Victory card from an empty supply pile you have.
    // Requires checking which piles are empty at game end — not available in score().
    return 0;
  }
}
