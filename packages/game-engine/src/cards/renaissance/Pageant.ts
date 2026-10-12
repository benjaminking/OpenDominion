import { CardInfoLookup } from '@dominion/card-info';

import { Project } from '../../card/Project';
import { SharedGameState } from '../../game-state/SharedGameState';

/**
 * Pageant: At the end of your Buy phase, you may pay $1 for +1 Coffers.
 *
 * Stub: Buy-phase coin spending and BUY_END player interaction not yet
 * supported as a persistent Project hook.
 */
export class Pageant extends Project {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Pageant'));

    // stub: BUY_END coin-pay interaction not yet implemented
  }
}
