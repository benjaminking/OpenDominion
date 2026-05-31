import { CardInfoLookup } from '@dominion/card-info';

import { Artifact } from '../../card/Artifact';
import { SharedGameState } from '../../SharedGameState';

/**
 * Flag: When drawing your hand, +1 Card.
 *
 * Stub: draw-hand hook (e.g. CLEANUP_START card-draw bonus) not yet wired to
 * per-player Artifact ownership.
 */
export class Flag extends Artifact {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Flag'));
  }
}
