import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Ironworks } from '../../../src/cards/intrigue/Ironworks';
import { createCardHarness } from '../testHarness';

describe('Ironworks', () => {
  it('gains a victory card and draws 1', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-in-supply');
    testHarness.addSupplyPile(estate);
    const drawCard = new Copper(testHarness.sharedGameState);
    drawCard.setId('draw-copper');
    testHarness.addToDeck(drawCard);

    testHarness.pickCard(estate);
    await new Ironworks(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(1); // gained estate
    expect(testHarness.hand.size()).toBe(1); // drew 1 from victory bonus
  });

  it('gains a treasure card and adds 1 coin', async () => {
    const testHarness = createCardHarness();
    const supplyCopper = new Copper(testHarness.sharedGameState);
    supplyCopper.setId('supply-copper');
    testHarness.addSupplyPile(supplyCopper);

    testHarness.pickCard(supplyCopper);
    await new Ironworks(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(1);
    expect(testHarness.stats.coins).toBe(1);
  });

  it('does nothing if no card is chosen', async () => {
    const testHarness = createCardHarness();
    // default: choice returns none
    await new Ironworks(testHarness.sharedGameState).play(testHarness.executor);
    expect(testHarness.discard.size()).toBe(0);
  });
});
