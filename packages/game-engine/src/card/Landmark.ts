import { CardInfo } from '@dominion/common';

import { SharedGameState } from '../game-state/SharedGameState';
import { CardCollection } from './CardCollection';
import { CardShapedObject } from './CardShapedObject';

export abstract class Landmark extends CardShapedObject {
  protected _numVPChips = 0;

  public constructor(sharedGameState: SharedGameState, cardInfo: CardInfo) {
    super(sharedGameState, cardInfo);
  }

  public abstract score(allCardGroups: CardCollection[]): number;
}
