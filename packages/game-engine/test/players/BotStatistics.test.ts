import { CardType } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Card } from '../../src/card/Card';
import { GameMessageBroadcaster } from '../../src/messaging/GameMessageBroadcaster';
import { BotStatistics } from '../../src/players/BotStatistics';
import { Player } from '../../src/players/Player';

const createBroadcaster = (): GameMessageBroadcaster => {
  return {
    updateBotCardCounts: vi.fn(),
    updateBotCoins: vi.fn(),
  } as unknown as GameMessageBroadcaster;
};

const createCard = (name: string, coins: number, types: CardType[]): Card => {
  return {
    getCoins: vi.fn(() => coins),
    getName: vi.fn(() => name),
    getTypes: vi.fn(() => types),
  } as unknown as Card;
};

describe('BotStatistics', () => {
  it('broadcasts updated coin totals and aggregated card counts as cards are added', () => {
    const broadcaster = createBroadcaster();
    const statistics = new BotStatistics({} as Player, broadcaster);
    const copper = createCard('Copper', 1, [CardType.TREASURE]);
    const silver = createCard('Silver', 2, [CardType.TREASURE]);

    statistics.addCardToStatistics(copper);
    statistics.addCardToStatistics(copper);
    statistics.addCardToStatistics(silver);

    expect(broadcaster.updateBotCoins).toHaveBeenNthCalledWith(1, 1);
    expect(broadcaster.updateBotCoins).toHaveBeenNthCalledWith(2, 2);
    expect(broadcaster.updateBotCoins).toHaveBeenNthCalledWith(3, 4);
    expect(broadcaster.updateBotCardCounts).toHaveBeenLastCalledWith([
      { name: 'Copper', count: 2 },
      { name: 'Silver', count: 1 },
    ]);
  });

  it('decrements statistics for known cards and ignores removals for names that were never tracked', () => {
    const broadcaster = createBroadcaster();
    const statistics = new BotStatistics({} as Player, broadcaster);
    const estate = createCard('Estate', 0, [CardType.VICTORY]);
    const duchy = createCard('Duchy', 0, [CardType.VICTORY]);

    statistics.addCardToStatistics(estate);
    statistics.addCardToStatistics(estate);
    statistics.removeCardFromStatistics(estate);
    statistics.removeCardFromStatistics(duchy);

    expect(broadcaster.updateBotCoins).toHaveBeenCalledTimes(3);
    expect(broadcaster.updateBotCoins).toHaveBeenLastCalledWith(0);
    expect(broadcaster.updateBotCardCounts).toHaveBeenLastCalledWith([{ name: 'Estate', count: 1 }]);
  });
});
