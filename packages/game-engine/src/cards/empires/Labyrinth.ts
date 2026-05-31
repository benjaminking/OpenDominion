import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { Landmark } from '../../card/Landmark';
import { SharedGameState } from '../../SharedGameState';

export class Labyrinth extends Landmark {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Labyrinth'));
  }

  score(_allCardGroups: CardCollection[]): number {
    // TODO: When you gain your second card in a turn: take 2 VP from here.
    return 0;
  }
}
