import { CardInfo } from '@dominion/common';

import { SharedGameState } from '../SharedGameState';
import { CardShapedObject } from './CardShapedObject';

/**
 * Base class for Renaissance Artifacts (Flag, Horn, Key, Lantern, Treasure Chest).
 * Artifacts are held by players and provide passive ongoing effects.
 * Full artifact-ownership tracking is not yet implemented; effects are stubs.
 */
export abstract class Artifact extends CardShapedObject {
  public constructor(sharedGameState: SharedGameState, cardInfo: CardInfo) {
    super(sharedGameState, cardInfo);
  }
}
