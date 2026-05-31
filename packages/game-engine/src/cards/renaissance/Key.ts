import { CardInfoLookup } from '@dominion/card-info';

import { Artifact } from '../../card/Artifact';
import { SharedGameState } from '../../SharedGameState';

/**
 * Key: At the start of your turn, +$1.
 *
 * Stub: per-player Artifact ownership and the TURN_START coin bonus are not
 * yet wired to the Artifact ownership system.
 */
export class Key extends Artifact {
  constructor(sharedGameState: SharedGameState) {
    super(sharedGameState, CardInfoLookup.lookUpCardInfo('Key'));
  }
}
