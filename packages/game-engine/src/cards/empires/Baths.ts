import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { Landmark } from '../../card/Landmark';
import { SharedGameState } from '../../SharedGameState';

export class Baths extends Landmark {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Baths'));
  }

  score(_allCardGroups: CardCollection[]): number {
    // TODO: When your turn ends without you having gained a card: take 2 VP from here.
    return 0;
  }
}
