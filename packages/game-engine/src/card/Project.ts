import { CardInfo } from '@dominion/common';

import { InstructionExecutor } from '../players/InstructionExecutor';
import { SharedGameState } from '../SharedGameState';
import { CardShapedObject } from './CardShapedObject';
import { Cost } from './Cost';

export abstract class Project extends CardShapedObject {
  private readonly _cost: Cost;

  public constructor(sharedGameState: SharedGameState, cardInfo: CardInfo) {
    super(sharedGameState, cardInfo);
    this._cost = Cost.fromCommonCost(cardInfo.cost);
  }

  /** Called when a player buys this project. Registers ongoing effects on that player. */
  public abstract onBuy(ie: InstructionExecutor): Promise<void>;

  public getCost(): Cost {
    return this._cost;
  }
}
