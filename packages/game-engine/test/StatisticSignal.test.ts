import { NumberType } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { GameMessageBroadcaster } from '../src/messaging/GameMessageBroadcaster';
import { StatisticSignal } from '../src/messaging/StatisticSignal';
import { Player } from '../src/players/Player';

const createMockPlayer = (name: string): Player => {
  return {
    getName: vi.fn(() => name),
  } as unknown as Player;
};

const createMockBroadcaster = (): GameMessageBroadcaster => {
  return {
    updateStatistic: vi.fn(),
  } as unknown as GameMessageBroadcaster;
};

describe('StatisticSignal', () => {
  describe('update/add/subtract/getValue', () => {
    it('should broadcast only when the value changes and keep the current total in sync', () => {
      const owner = createMockPlayer('Alice');
      const broadcaster = createMockBroadcaster();
      const signal = new StatisticSignal(owner, NumberType.COINS, broadcaster);

      signal.update(0);
      signal.add(3);
      signal.update(3);
      signal.subtract(1);

      expect(signal.getValue()).toBe(2);
      expect(broadcaster.updateStatistic).toHaveBeenCalledTimes(2);
      expect(broadcaster.updateStatistic).toHaveBeenNthCalledWith(1, owner, NumberType.COINS, 3);
      expect(broadcaster.updateStatistic).toHaveBeenNthCalledWith(2, owner, NumberType.COINS, 2);
    });
  });

  describe('forceBroadcast', () => {
    it('should broadcast the current value even when it has not changed', () => {
      const owner = createMockPlayer('Alice');
      const broadcaster = createMockBroadcaster();
      const signal = new StatisticSignal(owner, NumberType.ACTIONS, broadcaster);

      signal.add(2);
      signal.forceBroadcast();

      expect(broadcaster.updateStatistic).toHaveBeenCalledTimes(2);
      expect(broadcaster.updateStatistic).toHaveBeenNthCalledWith(1, owner, NumberType.ACTIONS, 2);
      expect(broadcaster.updateStatistic).toHaveBeenNthCalledWith(2, owner, NumberType.ACTIONS, 2);
    });
  });
});
