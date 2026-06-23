import { MoneyAmount, NumberType, ScoringElementType, VPChipScoringElement } from '@dominion/common';

import { Cost } from '../card/Cost';
import { GameMessageBroadcaster } from '../messaging/GameMessageBroadcaster';
import { StatisticSignal } from '../messaging/StatisticSignal';
import { Player } from './Player';

export class Statistics {
  private score: StatisticSignal;
  private coins: StatisticSignal;
  private potions: StatisticSignal;
  private actions: StatisticSignal;
  private buys: StatisticSignal;
  private vpChips: StatisticSignal;
  private coffers: StatisticSignal;

  constructor(private readonly player: Player) {
    const messageBroadcaster: GameMessageBroadcaster = this.player.getGame().getMessageBroadcaster();
    this.score = new StatisticSignal(player, NumberType.SCORE, messageBroadcaster);
    this.coins = new StatisticSignal(player, NumberType.COINS, messageBroadcaster);
    this.potions = new StatisticSignal(player, NumberType.POTIONS, messageBroadcaster);
    this.actions = new StatisticSignal(player, NumberType.ACTIONS, messageBroadcaster);
    this.buys = new StatisticSignal(player, NumberType.BUYS, messageBroadcaster);
    this.vpChips = new StatisticSignal(player, NumberType.VP_CHIPS, messageBroadcaster);
    this.coffers = new StatisticSignal(player, NumberType.COFFERS, messageBroadcaster);
  }

  public communicateInitialState() {
    this.score.forceBroadcast();
    this.coins.forceBroadcast();
    this.potions.forceBroadcast();
    this.actions.forceBroadcast();
    this.buys.forceBroadcast();
    this.vpChips.forceBroadcast();
    this.coffers.forceBroadcast();
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

  public getPotions(): number {
    return this.potions.getValue();
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
    this.resetPotions();
  }

  public addCoins(additionalCoins: number): Promise<void> {
    this.coins.add(additionalCoins);
    // This is async because Way of the Chameleon can cause you to draw cards here

    return Promise.resolve();
  }

  public subtractCoins(coinsToSubtract: number): void {
    this.coins.subtract(Math.min(coinsToSubtract, this.coins.getValue()));
  }

  public spendCoins(coinsSpent: number): void {
    this.coins.subtract(coinsSpent);
  }

  public addPotions(additionalPotions: number): void {
    this.potions.add(additionalPotions);
  }

  public spendPotions(potionsSpent: number): void {
    this.potions.subtract(potionsSpent);
  }

  public spendAmount(moneyAmount: MoneyAmount): void {
    this.spendCoins(moneyAmount.coins);
    this.spendPotions(moneyAmount.potions);
  }

  public resetCoins(): void {
    this.coins.update(0);
  }

  public resetPotions(): void {
    this.potions.update(0);
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

  public addCoffers(additionalCoffers: number): void {
    this.coffers.add(additionalCoffers);
  }

  public removeCoffers(amountToRemove: number): number {
    const amountActuallyRemoved = Math.min(this.coffers.getValue(), amountToRemove);
    this.coffers.subtract(amountActuallyRemoved);
    return amountActuallyRemoved;
  }

  public getCoffers(): number {
    return this.coffers.getValue();
  }

  public canAfford(cost: Cost): boolean {
    return this.getCoins() >= cost.coins && this.getPotions() >= cost.potions;
  }
}
