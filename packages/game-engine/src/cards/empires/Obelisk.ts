import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { Landmark } from '../../card/Landmark';
import { SharedGameState } from '../../SharedGameState';

export class Obelisk extends Landmark {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Obelisk'));
  }

  score(_allCardGroups: CardCollection[]): number {
    // TODO: During setup, choose a Supply pile. At end of game,
    // 2 VP per card from that pile you have.
    return 0;
  }
}
