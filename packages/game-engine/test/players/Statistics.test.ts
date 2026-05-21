import { NumberType } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Card } from '../../src/card/Card';
import { Cost } from '../../src/card/Cost';
import { CardEligibilityFunction } from '../../src/CardEligibilityFunction';
import { GameMessageBroadcaster } from '../../src/messaging/GameMessageBroadcaster';
import { Player } from '../../src/players/Player';
import { Statistics } from '../../src/players/Statistics';

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
    const statistics = new Statistics(createPlayer(broadcaster));

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
    statistics.startNewStandardTurn();
    statistics.startNewExtraTurn();

    expect(statistics.getScore()).toBe(12);
    expect(statistics.getCoins()).toBe(0);
    expect(statistics.getActions()).toBe(1);
    expect(statistics.getBuys()).toBe(1);
    expect(statistics.getTurnNumber()).toBe(1);
    expect(statistics.getUnofficialTurnNumber()).toBe(2);
    expect(broadcaster.updateStatistic).toHaveBeenCalledWith(expect.anything(), NumberType.SCORE, 12);
    expect(broadcaster.updateStatistic).toHaveBeenCalledWith(expect.anything(), NumberType.VP_CHIPS, 5);
  });

  it('tracks played and gained cards for matching queries and clears them on reset', () => {
    const statistics = new Statistics(createPlayer(createBroadcaster()));
    const silverA = createCard('Silver');
    const silverB = createCard('Silver');
    const gold = createCard('Gold');
    const silverOnly = new CardEligibilityFunction((card) => card.getName() === 'Silver');
    const goldOnly = new CardEligibilityFunction((card) => card.getName() === 'Gold');

    statistics.addPlayedCard(silverA);
    statistics.addPlayedCard(silverB);
    statistics.addGainedCard(gold);

    expect(statistics.getNumCardsPlayedThisTurn()).toBe(2);
    expect(statistics.hasPlayedMatchingCardThisTurn(silverOnly)).toBe(true);
    expect(statistics.hasGainedMatchingCardThisTurn(goldOnly)).toBe(true);
    expect(statistics.numMatchingCardsPlayedThisTurn(silverOnly)).toBe(2);

    statistics.reset();

    expect(statistics.getNumCardsPlayedThisTurn()).toBe(0);
    expect(statistics.hasPlayedMatchingCardThisTurn(silverOnly)).toBe(false);
    expect(statistics.hasGainedMatchingCardThisTurn(goldOnly)).toBe(false);
  });

  it('applies cleanup draw overrides and extra draws and compares coin affordability against costs', async () => {
    const statistics = new Statistics(createPlayer(createBroadcaster()));

    statistics.setNumExtraCardsToDrawInCleanup(2);
    expect(statistics.getNumCardsToDrawInCleanup(5)).toBe(7);

    statistics.setNumCardsToDrawInCleanup(3);
    expect(statistics.getNumCardsToDrawInCleanup(5)).toBe(5);

    await statistics.addCoins(4);

    expect(statistics.canAfford(Cost.Simple(4))).toBe(true);
    expect(statistics.canAfford(Cost.Simple(5))).toBe(false);
  });
});
