import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Forager } from '../../../src/cards/dark_ages/Forager';
import { createCardHarness } from '../testHarness';

describe('Forager', () => {
  it('gives +1 Action, +1 Buy, trashes a card, then +$1 per differently named Treasure in the trash', async () => {
    const testHarness = createCardHarness();
    const trashedSilver = new Silver(testHarness.sharedGameState);
    trashedSilver.setId('silver-trash-0');
    const trashedCopper = new Copper(testHarness.sharedGameState);
    trashedCopper.setId('copper-trash-0');
    const trashedEstate = new Estate(testHarness.sharedGameState);
    trashedEstate.setId('estate-trash-0');
    testHarness.sharedTrash.addCards([trashedSilver, trashedCopper, trashedEstate]);
    const handCopper = new Copper(testHarness.sharedGameState);
    handCopper.setId('copper-hand-0');
    testHarness.addToHand(handCopper);

    testHarness.pickCard(handCopper);
    await new Forager(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.stats.buys).toBe(1);
    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.sharedTrash.contains(handCopper)).toBe(true);
    // Copper (x2) and Silver: 2 differently named Treasures; Estate doesn't count
    expect(testHarness.stats.coins).toBe(2);
  });

  it('counts the Treasure it just trashed', async () => {
    const testHarness = createCardHarness();
    const handSilver = new Silver(testHarness.sharedGameState);
    handSilver.setId('silver-hand-0');
    testHarness.addToHand(handSilver);

    testHarness.pickCard(handSilver);
    await new Forager(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.asCardArray()).toEqual([handSilver]);
    expect(testHarness.stats.coins).toBe(1);
  });

  it('with an empty hand and no Treasures in the trash, gives no coins', async () => {
    const testHarness = createCardHarness();
    const trashedEstate = new Estate(testHarness.sharedGameState);
    trashedEstate.setId('estate-trash-0');
    testHarness.sharedTrash.addCard(trashedEstate);

    await new Forager(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.stats.buys).toBe(1);
    expect(testHarness.stats.coins).toBe(0);
  });
});
