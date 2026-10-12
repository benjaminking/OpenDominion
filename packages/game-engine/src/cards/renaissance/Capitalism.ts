import { CardInfoLookup } from '@dominion/card-info';

import { Project } from '../../card/Project';
import { SharedGameState } from '../../game-state/SharedGameState';

/**
 * Capitalism: During your turns, Action cards with +$ amounts in their text
 * are also Treasures.
 *
 * Stub: dynamically assigning extra card types based on card text at runtime
 * is not yet supported by the engine.
 */
export class Capitalism extends Project {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Capitalism'));

    // stub: runtime card-type modification not implemented
  }
}
