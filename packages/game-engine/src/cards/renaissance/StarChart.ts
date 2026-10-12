import { CardInfoLookup } from '@dominion/card-info';

import { Project } from '../../card/Project';
import { SharedGameState } from '../../game-state/SharedGameState';

/**
 * Star Chart: When shuffling, you may pick one of the cards to go on top.
 *
 * Stub: SHUFFLE trigger exists but the ability to designate one card to go on
 * top during a shuffle is not yet implemented in the engine.
 */
export class StarChart extends Project {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Star Chart'));

    // stub: shuffle-order intervention not yet implemented
  }
}
