import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { SharedGameState } from '../../SharedGameState';

export class Estate extends Card {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Estate'));
  }

  public score(_allCardGroups: CardCollection[]) {
    return 1;
  }
}
