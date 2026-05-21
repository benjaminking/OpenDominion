import { describe, expect, it } from 'vitest';

import { CardCollection } from '../../../src/card/CardCollection';
import { Gardens } from '../../../src/cards/base_game/Gardens';
import { createCardHarness } from '../testHarness';

describe('Gardens', () => {
  it('scores 1 VP per 10 total cards across all groups, floored', () => {
    const { sharedGameState } = createCardHarness();
    const gardens = new Gardens(sharedGameState);
    expect(gardens.getName()).toBe('Gardens');

    const group = (size: number) => ({ size: () => size }) as unknown as CardCollection;

    // 0 cards → 0
    expect(gardens.score([])).toBe(0);
    // 9 cards → 0 (not enough)
    expect(gardens.score([group(9)])).toBe(0);
    // 10 cards → 1
    expect(gardens.score([group(10)])).toBe(1);
    // 21 across two groups → 2 (floor)
    expect(gardens.score([group(11), group(10)])).toBe(2);
  });
});
