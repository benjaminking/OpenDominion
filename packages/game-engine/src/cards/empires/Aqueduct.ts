import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { Landmark } from '../../card/Landmark';
import { SharedGameState } from '../../SharedGameState';

export class Aqueduct extends Landmark {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Aqueduct'));
  }

  score(_allCardGroups: CardCollection[]): number {
    // TODO: Track VP tokens on Treasure and Victory supply piles;
    // when you gain a Treasure, move its pile VP to here;
    // when you gain a Victory card, take all VP here.
    // Scoring: count VP chips taken from here (tracked separately).
    return 0;
  }
}
