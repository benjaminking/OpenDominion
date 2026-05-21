import { describe, expect, it } from 'vitest';

import { Estate } from '../../../src/cards/basic_cards/Estate';
import { createCardHarness } from '../testHarness';

describe('Estate', () => {
  it('scores 1 point', () => {
    const { sharedGameState } = createCardHarness();
    const estate = new Estate(sharedGameState);

    expect(estate.getName()).toBe('Estate');
    expect(estate.score([])).toBe(1);
  });
});
