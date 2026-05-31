import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { Landmark } from '../../card/Landmark';
import { SharedGameState } from '../../SharedGameState';

export class Basilica extends Landmark {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Basilica'));
  }

  score(_allCardGroups: CardCollection[]): number {
    // TODO: When you gain a card during your buy phase: if you have $2 or more
    // remaining, take 2 VP from here.
    return 0;
  }
}
