import { describe, expect, it } from 'vitest';

import { Smithy } from '../../../src/cards/base_game/Smithy';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Remake } from '../../../src/cards/cornucopia_and_guilds/Remake';
import { createCardHarness } from '../testHarness';

describe('Remake', () => {
  it('twice trashes a card from hand and gains a card costing exactly $1 more', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-hand-0');
    testHarness.addToHand(estate);
    const handSilver = new Silver(testHarness.sharedGameState);
    handSilver.setId('silver-hand-0');
    testHarness.addToHand(handSilver);
    const supplySilver = new Silver(testHarness.sharedGameState);
    supplySilver.setId('silver-supply-0');
    testHarness.addSupplyPile(supplySilver);
    const smithy = new Smithy(testHarness.sharedGameState);
    smithy.setId('smithy-supply-0');
    testHarness.addSupplyPile(smithy);

    testHarness.pickCard(estate);
    testHarness.pickCard(supplySilver);
    testHarness.pickCard(handSilver);
    testHarness.pickCard(smithy);
    await new Remake(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.sharedTrash.asCardArray()).toEqual([estate, handSilver]);
    expect(testHarness.discard.asCardArray()).toEqual([supplySilver, smithy]);
  });

  it('gains nothing when no card costs exactly $1 more than the trashed card', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-hand-0');
    testHarness.addToHand(copper);
    // Silver costs $3, not $1
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-supply-0');
    testHarness.addSupplyPile(silver);

    testHarness.pickCard(copper);
    testHarness.pickCard(silver);
    await new Remake(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.asCardArray()).toEqual([copper]);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('does nothing with an empty hand', async () => {
    const testHarness = createCardHarness();
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-supply-0');
    testHarness.addSupplyPile(silver);

    await new Remake(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.discard.size()).toBe(0);
  });
});
