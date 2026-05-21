import { describe, expect, it, vi } from 'vitest';

import { ActionChoice } from '../../src/decisions/ActionChoice';

describe('ActionChoice', () => {
  it('returns the configured name', () => {
    expect(new ActionChoice('Gain a card').getName()).toBe('Gain a card');
  });

  it('runs a synchronous action when chosen', async () => {
    const action = vi.fn();
    const choice = new ActionChoice('Option A', action);

    await choice.performAction();

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('awaits an asynchronous action when chosen', async () => {
    const action = vi.fn(async () => Promise.resolve());
    const choice = new ActionChoice('Option B', action);

    await choice.performAction();

    expect(action).toHaveBeenCalledTimes(1);
  });
});
