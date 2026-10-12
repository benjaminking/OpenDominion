import { CardInfo } from '@dominion/common';

import { SharedGameState } from '../game-state/SharedGameState';
import { InstructionExecutor } from '../players/InstructionExecutor';
import { CardShapedObject } from './CardShapedObject';

export abstract class Hex extends CardShapedObject {
  public constructor(sharedGameState: SharedGameState, cardInfo: CardInfo) {
    super(sharedGameState, cardInfo);
  }

  public abstract receive(ie: InstructionExecutor): Promise<void>;
}
