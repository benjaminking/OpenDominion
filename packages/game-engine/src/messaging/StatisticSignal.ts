import { NumberType } from '@dominion/common';

import { Player } from '../players/Player';
import { GameMessageBroadcaster } from './GameMessageBroadcaster';

export class StatisticSignal {
  private value = 0;

  public constructor(
    private readonly owner: Player,
    private readonly type: NumberType,
    private readonly gameMessageBroadcaster: GameMessageBroadcaster,
  ) {}

  public update(newValue: number): void {
    if (newValue === this.value) {
      return;
    }

    this.value = newValue;
    this.broadcastValue();
  }

  public getValue(): number {
    return this.value;
  }

  public add(additionalAmount: number): void {
    this.update(this.value + additionalAmount);
  }

  public subtract(amount: number): void {
    this.update(this.value - amount);
  }

  private broadcastValue(): void {
    this.gameMessageBroadcaster.updateStatistic(this.owner, this.type, this.value);
  }

  public forceBroadcast(): void {
    this.broadcastValue();
  }
}
