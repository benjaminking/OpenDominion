import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { Landmark } from '../../card/Landmark';
import { SharedGameState } from '../../SharedGameState';

export class Arena extends Landmark {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Arena'));
  }

  score(_allCardGroups: CardCollection[]): number {
    // TODO: At the start of each buy phase: you may discard an Action card
    // to take 2 VP chips from here. Starts with 6*N VP chips.
    return 0;
  }
}
