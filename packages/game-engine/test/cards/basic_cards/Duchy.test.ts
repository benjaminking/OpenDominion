import { describe, expect, it } from 'vitest';

import { Duchy } from '../../../src/cards/basic_cards/Duchy';
import { createCardHarness } from '../testHarness';

describe('Duchy', () => {
  it('scores 3 points', () => {
    const { sharedGameState } = createCardHarness();
    const duchy = new Duchy(sharedGameState);

    expect(duchy.getName()).toBe('Duchy');
    expect(duchy.score([])).toBe(3);
  });
});
