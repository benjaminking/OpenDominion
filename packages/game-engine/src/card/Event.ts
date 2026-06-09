import { CardInfo } from '@dominion/common';

import { SharedGameState } from '../game-state/SharedGameState';
import { InstructionExecutor } from '../players/InstructionExecutor';
import { CardShapedObject } from './CardShapedObject';
import { Cost } from './Cost';

export abstract class Event extends CardShapedObject {
  private readonly _cost: Cost;

  public constructor(sharedGameState: SharedGameState, cardInfo: CardInfo) {
    super(sharedGameState, cardInfo);
    this._cost = Cost.fromCommonCost(cardInfo.cost);
  }

  public abstract onBuy(ie: InstructionExecutor): Promise<void>;

  public getCost(): Cost {
    return this._cost;
  }
}
