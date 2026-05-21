import { describe, expect, it } from 'vitest';

import { Lurker } from '../../../src/cards/intrigue/Lurker';
import { createCardHarness } from '../testHarness';

describe('Lurker', () => {
  it('adds 1 action', async () => {
    const testHarness = createCardHarness();
    testHarness.pickOption('Trash an Action card from the Supply');
    // no supply card to pick (choice returns none)
    await new Lurker(testHarness.sharedGameState).play(testHarness.executor);
    expect(testHarness.stats.actions).toBe(1);
  });
});
