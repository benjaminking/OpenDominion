import { CardType } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Colony } from '../../../src/cards/basic_cards/Colony';
import { createCardHarness } from '../testHarness';

describe('Colony', () => {
  it('is a Victory card costing $11 that scores 10 points', () => {
    const { sharedGameState } = createCardHarness();
    const colony = new Colony(sharedGameState);

    expect(colony.getName()).toBe('Colony');
    expect(colony.hasType(CardType.VICTORY)).toBe(true);
    expect(colony.getOriginalCost().coins).toBe(11);
    expect(colony.score([])).toBe(10);
  });
});
