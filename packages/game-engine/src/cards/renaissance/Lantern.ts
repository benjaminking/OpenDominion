import { CardInfoLookup } from '@dominion/card-info';

import { Artifact } from '../../card/Artifact';
import { SharedGameState } from '../../SharedGameState';

/**
 * Lantern: Border Guards you play reveal 3 cards and discard 2.
 * (It takes all 3 being Actions to take the Horn.)
 *
 * Stub: modifying Border Guard's reveal-N behavior based on Artifact ownership
 * is not yet implemented.
 */
export class Lantern extends Artifact {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Lantern'));
  }
}
