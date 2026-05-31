import { CardInfoLookup } from '@dominion/card-info';

import { Artifact } from '../../card/Artifact';
import { SharedGameState } from '../../SharedGameState';

/**
 * Treasure Chest: At the start of your Buy phase, gain a Gold.
 *
 * Stub: per-player Artifact ownership and the BUY_START gold-gain are not yet
 * wired to the Artifact ownership system.
 */
export class TreasureChest extends Artifact {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Treasure Chest'));
  }
}
