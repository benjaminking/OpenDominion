import { describe, expect, it } from 'vitest';

import { Curse } from '../../../src/cards/basic_cards/Curse';
import { createCardHarness } from '../testHarness';

describe('Curse', () => {
  it('scores -1 point', () => {
    const { sharedGameState } = createCardHarness();
    const curse = new Curse(sharedGameState);

    expect(curse.getName()).toBe('Curse');
    expect(curse.score()).toBe(-1);
  });
});
