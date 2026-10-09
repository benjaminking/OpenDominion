import { describe, expect, it } from 'vitest';

import { Smithy } from '../../../src/cards/base_game/Smithy';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Butcher } from '../../../src/cards/cornucopia_and_guilds/Butcher';
import { createCardHarness } from '../testHarness';

describe('Butcher', () => {
  it('gives +2 Coffers and trashes nothing if no card is chosen', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-hand-0');
    testHarness.addToHand(estate);

    await new Butcher(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coffers).toBe(2);
    expect(testHarness.hand.asCardArray()).toEqual([estate]);
    expect(testHarness.sharedTrash.size()).toBe(0);
  });

  it('trashes a card and gains one costing up to $1 more per Coffers spent', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-hand-0');
    testHarness.addToHand(estate);
    const smithy = new Smithy(testHarness.sharedGameState);
    smithy.setId('smithy-supply-0');
    testHarness.addSupplyPile(smithy);

    testHarness.pickCard(estate);
    testHarness.pickOption('2');
    testHarness.pickCard(smithy);
    await new Butcher(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.asCardArray()).toEqual([estate]);
    expect(testHarness.discard.asCardArray()).toEqual([smithy]);
    expect(testHarness.stats.coffers).toBe(0);
  });

  it('cannot gain a card costing more than the Coffers spent allow', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-hand-0');
    testHarness.addToHand(estate);
    // Smithy costs $4: Estate ($2) + 1 Coffers only reaches $3
    const smithy = new Smithy(testHarness.sharedGameState);
    smithy.setId('smithy-supply-0');
    testHarness.addSupplyPile(smithy);

    testHarness.pickCard(estate);
    testHarness.pickOption('1');
    testHarness.pickCard(smithy);
    await new Butcher(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.asCardArray()).toEqual([estate]);
    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.stats.coffers).toBe(1);
  });
});
