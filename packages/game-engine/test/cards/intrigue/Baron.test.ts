import { describe, expect, it } from 'vitest';

import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Baron } from '../../../src/cards/intrigue/Baron';
import { createCardHarness } from '../testHarness';

describe('Baron', () => {
  it('adds 1 buy', async () => {
    const testHarness = createCardHarness();
    await new Baron(testHarness.sharedGameState).play(testHarness.executor);
    expect(testHarness.stats.buys).toBe(1);
  });

  it('discards an Estate from hand for +$4', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-in-hand');
    testHarness.addToHand(estate);

    testHarness.pickCard(estate);
    await new Baron(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(1);
    expect(testHarness.stats.coins).toBe(4);
  });

  it('gains an Estate when no Estate is discarded', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-in-supply');
    testHarness.addSupplyPile(estate);

    // default: choose none
    await new Baron(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(1);
    expect(testHarness.stats.coins).toBe(0);
  });
});
