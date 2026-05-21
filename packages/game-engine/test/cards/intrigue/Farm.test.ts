import { describe, expect, it } from 'vitest';

import { Farm } from '../../../src/cards/intrigue/Farm';
import { createCardHarness } from '../testHarness';

describe('Farm', () => {
  it('adds 2 coins when played', async () => {
    const testHarness = createCardHarness();
    await new Farm(testHarness.sharedGameState).play(testHarness.executor);
    expect(testHarness.stats.coins).toBe(2);
  });

  it('scores 2 VP', () => {
    const testHarness = createCardHarness();
    expect(new Farm(testHarness.sharedGameState).score([])).toBe(2);
  });
});
