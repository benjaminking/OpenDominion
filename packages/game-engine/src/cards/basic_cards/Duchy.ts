import { CardInfoLookup } from '@dominion/card-info';

import { Card } from '../../card/Card';
import { CardCollection } from '../../card/CardCollection';
import { SharedGameState } from '../../game-state/SharedGameState';

export class Duchy extends Card {
  public constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Duchy'));
  }

  public score(_allCardGroups: CardCollection[]) {
    return 3;
  }
}
