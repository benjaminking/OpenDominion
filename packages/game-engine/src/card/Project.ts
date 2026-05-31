import { CardInfo } from '@dominion/common';

import { SharedGameState } from '../SharedGameState';
import { CardShapedObject } from './CardShapedObject';

export class Project extends CardShapedObject {
  public constructor(sharedGameState: SharedGameState, cardInfo: CardInfo) {
    super(sharedGameState, cardInfo);
  }
}
