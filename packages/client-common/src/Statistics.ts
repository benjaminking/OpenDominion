import { NumberType } from '@dominion/common';

export class Statistics {
  private _numActions = 0;
  private _numCoins = 0;
  private _numBuys = 0;
  private _numPoints = 0;

  public get numActions(): number {
    return this._numActions;
  }

  public get numCoins(): number {
    return this._numCoins;
  }

  public get numBuys(): number {
    return this._numBuys;
  }

  public get numPoints(): number {
    return this._numPoints;
  }

  updateScore(value: number): void {
    this._numPoints = value;
  }

  updateActions(value: number): void {
    this._numActions = value;
  }

  updateCoins(value: number): void {
    this._numCoins = value;
  }

  updateBuys(value: number): void {
    this._numBuys = value;
  }

  updateStatistic(type: NumberType, value: number): void {
    switch (type) {
      case NumberType.SCORE: {
        this.updateScore(value);
        break;
      }
      case NumberType.ACTIONS: {
        this.updateActions(value);
        break;
      }
      case NumberType.BUYS: {
        this.updateBuys(value);
        break;
      }
      case NumberType.COINS: {
        this.updateCoins(value);
        break;
      }
    }
  }
}
