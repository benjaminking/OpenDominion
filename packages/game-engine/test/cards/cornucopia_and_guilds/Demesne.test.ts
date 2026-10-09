import { describe, expect, it } from 'vitest';

import { CardCollection } from '../../../src/card/CardCollection';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Demesne } from '../../../src/cards/cornucopia_and_guilds/Demesne';
import { createCardHarness } from '../testHarness';

describe('Demesne', () => {
  it('gives +2 Actions, +2 Buys and gains a Gold', async () => {
    const testHarness = createCardHarness();
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-supply-0');
    testHarness.addSupplyPile(gold);

    await new Demesne(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.stats.buys).toBe(2);
    expect(testHarness.discard.asCardArray()).toEqual([gold]);
  });

  it('is worth 1 VP per Gold across all of your cards', () => {
    const testHarness = createCardHarness();
    const demesne = new Demesne(testHarness.sharedGameState);
    demesne.setId('demesne-0');
    const goldA = new Gold(testHarness.sharedGameState);
    goldA.setId('gold-0');
    const goldB = new Gold(testHarness.sharedGameState);
    goldB.setId('gold-1');
    const goldC = new Gold(testHarness.sharedGameState);
    goldC.setId('gold-2');
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-0');

    const score = demesne.score([
      CardCollection.fromCards([goldA, goldB, demesne]),
      CardCollection.fromCards([copper]),
      CardCollection.fromCards([goldC]),
    ]);

    expect(score).toBe(3);
  });

  it('is worth 0 VP with no Golds', () => {
    const testHarness = createCardHarness();
    const demesne = new Demesne(testHarness.sharedGameState);
    demesne.setId('demesne-0');
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-0');

    expect(demesne.score([CardCollection.fromCards([demesne, copper])])).toBe(0);
  });
});
