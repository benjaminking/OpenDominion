import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { Landmark } from '../../card/Landmark';
import { SharedGameState } from '../../SharedGameState';

export class MountainPass extends Landmark {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Mountain Pass'));
  }

  score(_allCardGroups: CardCollection[]): number {
    // TODO: When you are the first to gain a Province: each player bids debt
    // (up to 40), highest bidder takes 8 VP and pays their bid in debt.
    return 0;
  }
}
