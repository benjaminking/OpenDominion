import { describe, expect, it } from 'vitest';

import { Province } from '../../../src/cards/basic_cards/Province';
import { createCardHarness } from '../testHarness';

describe('Province', () => {
  it('scores 6 points', () => {
    const { sharedGameState } = createCardHarness();
    const province = new Province(sharedGameState);

    expect(province.getName()).toBe('Province');
    expect(province.score([])).toBe(6);
  });
});
