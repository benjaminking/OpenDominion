import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { Landmark } from '../../card/Landmark';
import { SharedGameState } from '../../SharedGameState';

export class Keep extends Landmark {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Keep'));
  }

  score(_allCardGroups: CardCollection[]): number {
    // TODO: At end of game: for each type of Treasure, the player(s) with the
    // most of that Treasure score +5VP.
    // Requires comparing across all players — not implementable in single-player score().
    return 0;
  }
}
