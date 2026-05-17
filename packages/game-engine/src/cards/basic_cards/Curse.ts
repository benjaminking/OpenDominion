import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { SharedGameState } from '../../SharedGameState';

export class Curse extends Card {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Curse'));
  }

  public score() {
    return -1;
  }
}
