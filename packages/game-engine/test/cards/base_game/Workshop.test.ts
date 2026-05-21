import { describe, expect, it } from 'vitest';

import { Workshop } from '../../../src/cards/base_game/Workshop';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { createCardHarness } from '../testHarness';

describe('Workshop', () => {
  it('gains the chosen card from supply to discard', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-supply-0');
    testHarness.addSupplyPile(estate);

    testHarness.pickCard(estate);
    await new Workshop(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(1);
    expect(testHarness.discard.asCardArray()[0].getName()).toBe('Estate');
  });
});
