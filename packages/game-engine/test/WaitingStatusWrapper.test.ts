import { StatusAction } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { GameMessageBroadcaster } from '../src/messaging/GameMessageBroadcaster';
import { PlayerNameStatus } from '../src/messaging/Status';
import { wrapWithWaitingStatus } from '../src/messaging/WaitingStatusWrapper';
import { Player } from '../src/players/Player';

const createMockPlayer = (name: string): Player => {
  return {
    getName: vi.fn(() => name),
  } as unknown as Player;
};

describe('wrapWithWaitingStatus', () => {
  it('should push a waiting status, run the wrapped function, then pop the status and return the result', () => {
    const targetPlayer = createMockPlayer('Alice');
    const sequence: string[] = [];
    const sendStatus = vi.fn((status: PlayerNameStatus, action: StatusAction) => {
      sequence.push(`${action}:${status.renderForPlayer(targetPlayer)}`);
    });
    const broadcaster = {
      sendStatus,
    } as unknown as GameMessageBroadcaster;
    const wrappedFunction = vi.fn(() => {
      sequence.push('wrapped');
      return 'done';
    });

    const result = wrapWithWaitingStatus(broadcaster, targetPlayer, wrappedFunction);

    expect(result).toBe('done');
    expect(wrappedFunction).toHaveBeenCalledTimes(1);
    expect(sendStatus).toHaveBeenCalledTimes(2);
    expect(sendStatus).toHaveBeenNthCalledWith(1, expect.any(PlayerNameStatus), StatusAction.PUSH);
    expect(sendStatus).toHaveBeenNthCalledWith(2, expect.any(PlayerNameStatus), StatusAction.POP);
    expect(sequence).toEqual([`${StatusAction.PUSH}:Waiting for you...`, 'wrapped', `${StatusAction.POP}:`]);
  });

  it('should pop the waiting status even when the wrapped function throws', () => {
    const targetPlayer = createMockPlayer('Alice');
    const sequence: string[] = [];
    const sendStatus = vi.fn((status: PlayerNameStatus, action: StatusAction) => {
      sequence.push(`${action}:${status.renderForPlayer(targetPlayer)}`);
    });
    const broadcaster = {
      sendStatus,
    } as unknown as GameMessageBroadcaster;
    const wrappedFunction = vi.fn(() => {
      sequence.push('wrapped');
      throw new Error('boom');
    });

    expect(() => wrapWithWaitingStatus(broadcaster, targetPlayer, wrappedFunction)).toThrow('boom');
    expect(wrappedFunction).toHaveBeenCalledTimes(1);
    expect(sendStatus).toHaveBeenCalledTimes(2);
    expect(sendStatus).toHaveBeenNthCalledWith(1, expect.any(PlayerNameStatus), StatusAction.PUSH);
    expect(sendStatus).toHaveBeenNthCalledWith(2, expect.any(PlayerNameStatus), StatusAction.POP);
    expect(sequence).toEqual([`${StatusAction.PUSH}:Waiting for you...`, 'wrapped', `${StatusAction.POP}:`]);
  });
});
