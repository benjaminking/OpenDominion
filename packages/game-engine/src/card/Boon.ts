import { CardInfo } from '@dominion/common';

import { InstructionExecutor } from '../players/InstructionExecutor';
import { SharedGameState } from '../SharedGameState';
import { CardShapedObject } from './CardShapedObject';

export abstract class Boon extends CardShapedObject {
  public constructor(sharedGameState: SharedGameState, cardInfo: CardInfo) {
    super(sharedGameState, cardInfo);
  }

  public abstract receive(ie: InstructionExecutor): Promise<void>;
}
