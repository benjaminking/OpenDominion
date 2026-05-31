import { CardInfo } from '@dominion/common';

import { InstructionExecutor } from '../players/InstructionExecutor';
import { SharedGameState } from '../SharedGameState';
import { CardShapedObject } from './CardShapedObject';

export abstract class Event extends CardShapedObject {
  public constructor(sharedGameState: SharedGameState, cardInfo: CardInfo) {
    super(sharedGameState, cardInfo);
  }

  public abstract onBuy(ie: InstructionExecutor): Promise<void>;
}
