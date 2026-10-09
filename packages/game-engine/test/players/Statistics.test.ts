import { NumberType } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Card } from '../../src/card/Card';
import { Cost } from '../../src/card/Cost';
import { CardEligibilityFunction } from '../../src/CardEligibilityFunction';
import { GameMessageBroadcaster } from '../../src/messaging/GameMessageBroadcaster';
import { Player } from '../../src/players/Player';
import { Statistics } from '../../src/players/Statistics';
import { TurnTracker } from '../../src/players/TurnTracker';
import { Turn } from '../../src/turns/Turn';

const createBroadcaster = (): GameMessageBroadcaster => {
  return {
    updateStatistic: vi.fn(),
  } as unknown as GameMessageBroadcaster;
};

const createPlayer = (broadcaster: GameMessageBroadcaster): Player => {
  return {
    getGame: vi.fn(() => ({
      getMessageBroadcaster: vi.fn(() => broadcaster),
    })),
    getName: vi.fn(() => 'Alice'),
  } as unknown as Player;
};

const createCard = (name: string): Card => {
  return {
    getId: vi.fn(() => `${name}-${Math.random().toString(16).slice(2)}`),
    getName: vi.fn(() => name),
  } as unknown as Card;
};

describe('Statistics', () => {
  it('tracks score, turn counters, and standard turn resources while broadcasting statistic changes', async () => {
    const broadcaster = createBroadcaster();
    const player = createPlayer(broadcaster);
    const statistics = new Statistics(player);
    const turnTracker = new TurnTracker(new Turn(player, 0, 0));

    statistics.communicateInitialState();
    statistics.setScore(12);
    await statistics.addCoins(4);
    statistics.spendCoins(1);
    statistics.resetCoins();
    statistics.addActions(3);
    statistics.useAction();
    statistics.resetActions();
    statistics.addBuys(2);
    statistics.useBuy();
    statistics.resetBuys();
    statistics.addVP(5);
    turnTracker.startNewStandardTurn();
    turnTracker.startNewExtraTurn();

    expect(statistics.getScore()).toBe(12);
    expect(statistics.getCoins()).toBe(0);
    expect(statistics.getActions()).toBe(1);
    expect(statistics.getBuys()).toBe(1);
    expect(turnTracker.getCurrentTurn().getNumber()).toBe(1);
    expect(turnTracker.getCurrentTurn().getUnofficialNumber()).toBe(2);
    expect(broadcaster.updateStatistic).toHaveBeenCalledWith(expect.anything(), NumberType.SCORE, 12);
    expect(broadcaster.updateStatistic).toHaveBeenCalledWith(expect.anything(), NumberType.VP_CHIPS, 5);
  });

  it('tracks played and gained cards for matching queries and clears them on reset', () => {
    const player = createPlayer(createBroadcaster());
    const statistics = new Statistics(player);
    const turnTracker = new TurnTracker(new Turn(player, 0, 0));
    const silverA = createCard('Silver');
    const silverB = createCard('Silver');
    const gold = createCard('Gold');
    const silverOnly = new CardEligibilityFunction((card) => card.getName() === 'Silver');
    const goldOnly = new CardEligibilityFunction((card) => card.getName() === 'Gold');

    turnTracker.addPlayedCard(silverA);
    turnTracker.addPlayedCard(silverB);
    turnTracker.addGainedCard(gold);

    expect(turnTracker.getNumCardsPlayedThisTurn()).toBe(2);
    expect(turnTracker.hasPlayedMatchingCardThisTurn(silverOnly)).toBe(true);
    expect(turnTracker.hasGainedMatchingCardThisTurn(goldOnly)).toBe(true);
    expect(turnTracker.numMatchingCardsPlayedThisTurn(silverOnly)).toBe(2);

    statistics.reset();

    expect(turnTracker.getNumCardsPlayedThisTurn()).toBe(2);
    expect(turnTracker.hasPlayedMatchingCardThisTurn(silverOnly)).toBe(true);
  });

  it('applies cleanup draw overrides and extra draws and compares coin affordability against costs', async () => {
    const player = createPlayer(createBroadcaster());
    const statistics = new Statistics(player);
    const turnTracker = new TurnTracker(new Turn(player, 0, 0));

    turnTracker.setNumExtraCardsToDrawInCleanup(2);
    expect(turnTracker.getNumCardsToDrawInCleanup(5)).toBe(7);

    turnTracker.setNumCardsToDrawInCleanup(3);
    expect(turnTracker.getNumCardsToDrawInCleanup(5)).toBe(5);

    await statistics.addCoins(4);

    expect(statistics.canAfford(Cost.Simple(4))).toBe(true);
    expect(statistics.canAfford(Cost.Simple(5))).toBe(false);
  });

  it('broadcasts potions and coffers along with the other statistics in the initial state', () => {
    const broadcaster = createBroadcaster();
    const player = createPlayer(broadcaster);
    const statistics = new Statistics(player);

    statistics.communicateInitialState();

    expect(broadcaster.updateStatistic).toHaveBeenCalledWith(player, NumberType.POTIONS, 0);
    expect(broadcaster.updateStatistic).toHaveBeenCalledWith(player, NumberType.COFFERS, 0);
  });

  it('tracks potions and resets them with the other per-turn resources while coffers persist', async () => {
    const broadcaster = createBroadcaster();
    const player = createPlayer(broadcaster);
    const statistics = new Statistics(player);

    statistics.addPotions(2);
    statistics.spendPotions(1);
    statistics.addCoffers(3);
    await statistics.addCoins(5);
    expect(statistics.getPotions()).toBe(1);
    expect(broadcaster.updateStatistic).toHaveBeenCalledWith(player, NumberType.POTIONS, 1);

    statistics.reset();

    expect(statistics.getPotions()).toBe(0);
    expect(statistics.getCoins()).toBe(0);
    expect(statistics.getActions()).toBe(1);
    expect(statistics.getBuys()).toBe(1);
    expect(statistics.getCoffers()).toBe(3);
  });

  it('subtracts coins without going below zero', async () => {
    const statistics = new Statistics(createPlayer(createBroadcaster()));
    await statistics.addCoins(3);

    statistics.subtractCoins(2);
    expect(statistics.getCoins()).toBe(1);

    statistics.subtractCoins(4);
    expect(statistics.getCoins()).toBe(0);
  });

  it('spends a money amount of coins and potions', async () => {
    const statistics = new Statistics(createPlayer(createBroadcaster()));
    await statistics.addCoins(5);
    statistics.addPotions(1);

    statistics.spendAmount({ coins: 3, potions: 1 });

    expect(statistics.getCoins()).toBe(2);
    expect(statistics.getPotions()).toBe(0);
  });

  it('removes at most the coffers available and reports how many were removed', () => {
    const broadcaster = createBroadcaster();
    const player = createPlayer(broadcaster);
    const statistics = new Statistics(player);
    statistics.addCoffers(3);

    expect(statistics.removeCoffers(2)).toBe(2);
    expect(statistics.getCoffers()).toBe(1);
    expect(statistics.removeCoffers(5)).toBe(1);
    expect(statistics.getCoffers()).toBe(0);
    expect(statistics.removeCoffers(1)).toBe(0);
    expect(broadcaster.updateStatistic).toHaveBeenCalledWith(player, NumberType.COFFERS, 3);
  });

  it('requires both enough coins and enough potions to afford a cost', async () => {
    const statistics = new Statistics(createPlayer(createBroadcaster()));
    await statistics.addCoins(4);

    expect(statistics.canAfford(Cost.Potion(2))).toBe(false);

    statistics.addPotions(1);

    expect(statistics.canAfford(Cost.Potion(2))).toBe(true);
    expect(statistics.canAfford(Cost.Potion(5))).toBe(false);
    expect(statistics.canAfford(Cost.Simple(4))).toBe(true);
  });
});
