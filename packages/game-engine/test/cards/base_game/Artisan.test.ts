import { describe, expect, it } from 'vitest';

import { Artisan } from '../../../src/cards/base_game/Artisan';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { createCardHarness } from '../testHarness';

describe('Artisan', () => {
  it('gains a card to hand then topdecks a chosen hand card', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-supply-0');
    testHarness.addSupplyPile(estate);

    testHarness.pickCard(estate); // gain to hand
    testHarness.pickCard(estate); // topdeck from hand
    await new Artisan(testHarness.sharedGameState).play(testHarness.executor);

    // gained to hand then moved to deck
    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.deck.size()).toBe(1);
    expect(testHarness.deck.getTopCard()!.getName()).toBe('Estate');
  });
});
