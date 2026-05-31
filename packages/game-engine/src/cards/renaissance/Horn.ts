import { CardInfoLookup } from '@dominion/card-info';

import { Artifact } from '../../card/Artifact';
import { SharedGameState } from '../../SharedGameState';

/**
 * Horn: Once per turn, when you discard a Border Guard from play, you may put
 * it onto your deck.
 *
 * Stub: discard-from-play hook keyed on a specific card name and Artifact
 * ownership is not yet implemented.
 */
export class Horn extends Artifact {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Horn'));
  }
}
