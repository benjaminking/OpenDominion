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
});
