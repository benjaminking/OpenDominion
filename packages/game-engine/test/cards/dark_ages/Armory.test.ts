import { describe, expect, it } from 'vitest';

import { Smithy } from '../../../src/cards/base_game/Smithy';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Duchy } from '../../../src/cards/basic_cards/Duchy';
import { Armory } from '../../../src/cards/dark_ages/Armory';
import { createCardHarness } from '../testHarness';

describe('Armory', () => {
  it('gains a card costing up to $4 onto the deck', async () => {
    const testHarness = createCardHarness();
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId('copper-deck-0');
    testHarness.addToDeck(deckCopper);
    const smithy = new Smithy(testHarness.sharedGameState);
    smithy.setId('smithy-supply-0');
    testHarness.addSupplyPile(smithy);

    testHarness.pickCard(smithy);
    await new Armory(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.deck.size()).toBe(2);
    expect(testHarness.deck.getTopCard()).toBe(smithy);
    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.pileCards.get('Smithy')).toEqual([]);
  });

  it('cannot gain a card costing more than $4', async () => {
    const testHarness = createCardHarness();
    const duchy = new Duchy(testHarness.sharedGameState);
    duchy.setId('duchy-supply-0');
    testHarness.addSupplyPile(duchy);

    await new Armory(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.deck.size()).toBe(0);
    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.pileCards.get('Duchy')).toEqual([duchy]);
  });
});
