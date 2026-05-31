import { CardInfoLookup } from '@dominion/card-info';

import { CardCollection } from '../../card/CardCollection';
import { Landmark } from '../../card/Landmark';
import { SharedGameState } from '../../SharedGameState';

export class DefiledShrine extends Landmark {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Defiled Shrine'));
  }

  score(_allCardGroups: CardCollection[]): number {
    // TODO: When you buy an Action: move 1 VP from its pile to here.
    // When you gain a Curse: take all VP from here.
    return 0;
  }
}
