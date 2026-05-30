import { describe, expect, it, vi } from 'vitest';

import { MessageHandler } from '../../src/message/MessageHandler';

interface CardCountMessage {
  owner: string;
  location: string;
  count: number;
}

describe('MessageHandler', () => {
  it('notifies subscribers for matching indexed keys with payload omitting index fields', () => {
    const handler = new MessageHandler<CardCountMessage, 'owner' | 'location'>(['owner', 'location']);
    const callback = vi.fn();

    handler.subscribe({ location: 'HAND', owner: 'Alice' }, callback);
    handler.handleMessage({ owner: 'Alice', location: 'HAND', count: 5 });
    handler.handleMessage({ owner: 'Bob', location: 'HAND', count: 8 });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({ count: 5 });
  });

  it('replays the most recent message immediately on late subscription', () => {
    const handler = new MessageHandler<CardCountMessage, 'owner' | 'location'>(['owner', 'location']);

    handler.handleMessage({ owner: 'Alice', location: 'DECK', count: 9 });

    const callback = vi.fn();
    handler.subscribe({ owner: 'Alice', location: 'DECK' }, callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({ count: 9 });
  });

  it('supports non-indexed handlers by broadcasting to the empty key', () => {
    const handler = new MessageHandler<{ text: string }>();
    const callback = vi.fn();

    handler.subscribe({}, callback);
    handler.handleMessage({ text: 'hello' });

    expect(callback).toHaveBeenCalledWith({ text: 'hello' });
  });

  it('can clear cached most-recent values so new subscribers do not get stale replay', () => {
    const handler = new MessageHandler<{ text: string }>();
    handler.handleMessage({ text: 'old' });
    handler.clearMostRecentValues();

    const callback = vi.fn();
    handler.subscribe({}, callback);

    expect(callback).not.toHaveBeenCalled();
  });
});
