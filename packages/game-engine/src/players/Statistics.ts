import { NumberType, ScoringElementType, VPChipScoringElement } from '@dominion/common';

import { Cost } from '../card/Cost';
import { GameMessageBroadcaster } from '../messaging/GameMessageBroadcaster';
import { StatisticSignal } from '../messaging/StatisticSignal';
import { Player } from './Player';

export class Statistics {
  private score: StatisticSignal;
  private coins: StatisticSignal;
  private actions: StatisticSignal;
  private buys: StatisticSignal;
  private vpChips: StatisticSignal;

  constructor(private readonly player: Player) {
    const messageBroadcaster: GameMessageBroadcaster = this.player.getGame().getMessageBroadcaster();
    this.score = new StatisticSignal(player, NumberType.SCORE, messageBroadcaster);
    this.coins = new StatisticSignal(player, NumberType.COINS, messageBroadcaster);
    this.actions = new StatisticSignal(player, NumberType.ACTIONS, messageBroadcaster);
    this.buys = new StatisticSignal(player, NumberType.BUYS, messageBroadcaster);
    this.vpChips = new StatisticSignal(player, NumberType.VP_CHIPS, messageBroadcaster);
  }

  public communicateInitialState() {
    this.score.forceBroadcast();
    this.coins.forceBroadcast();
    this.actions.forceBroadcast();
    this.buys.forceBroadcast();
    this.vpChips.forceBroadcast();
  }

  public getScore(): number {
    return this.score.getValue();
  }
  setScore(score: number): void {
    this.score.update(score);
  }

  public getCoins(): number {
    return this.coins.getValue();
  }

  public getActions(): number {
    return this.actions.getValue();
  }

  public getBuys(): number {
    return this.buys.getValue();
  }

  public reset(): void {
    this.resetActions();
    this.resetBuys();
    this.resetCoins();
  }

  public addCoins(additionalCoins: number): Promise<void> {
    this.coins.add(additionalCoins);
    // This is async because Way of the Chameleon can cause you to draw cards here

    return Promise.resolve();
  }

  public spendCoins(coinsSpent: number): void {
    this.coins.subtract(coinsSpent);
  }

  public resetCoins(): void {
    this.coins.update(0);
  }

  public addActions(additionalActions: number): void {
    this.actions.add(additionalActions);
  }

  public useAction(): void {
    this.actions.subtract(1);
  }

  public resetActions(): void {
    this.actions.update(1);
  }

  public addBuys(additionalBuys: number): void {
    this.buys.add(additionalBuys);
  }

  public useBuy(): void {
    this.buys.subtract(1);
  }

  public resetBuys(): void {
    this.buys.update(1);
  }

  public addVP(additionalVPChips: number): void {
    this.vpChips.add(additionalVPChips);
  }

  public getVPChipScoringElement(): VPChipScoringElement {
    return {
      type: ScoringElementType.VP_CHIP,
      totalPoints: this.vpChips.getValue(),
    };
  }

  public canAfford(cost: Cost): boolean {
    return this.getCoins() >= cost.coins;
  }
}
