import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { Landmark } from '../../card/Landmark';
import { SharedGameState } from '../../SharedGameState';

export class Colonnade extends Landmark {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Colonnade'));
  }

  score(_allCardGroups: CardCollection[]): number {
    // TODO: When you gain an Action card during your buy phase: if you have a
    // copy of it in play, take 2 VP from here.
    return 0;
  }
}
