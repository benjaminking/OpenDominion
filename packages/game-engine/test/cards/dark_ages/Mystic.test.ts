import { describe, expect, it } from 'vitest';

import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Mystic } from '../../../src/cards/dark_ages/Mystic';
import { createCardHarness } from '../testHarness';

const setUp = () => {
  const testHarness = createCardHarness();
  const supplySilver = new Silver(testHarness.sharedGameState);
  supplySilver.setId('silver-supply-0');
  testHarness.addSupplyPile(supplySilver);
  const supplyGold = new Gold(testHarness.sharedGameState);
  supplyGold.setId('gold-supply-0');
  testHarness.addSupplyPile(supplyGold);
  const deckSilver = new Silver(testHarness.sharedGameState);
  deckSilver.setId('silver-deck-0');
  testHarness.addToDeck(deckSilver);
  return { testHarness, supplySilver, supplyGold };
};

describe('Mystic', () => {
  it('gives +1 Action and +$2', async () => {
    const testHarness = createCardHarness();

    await new Mystic(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.stats.coins).toBe(2);
    expect(testHarness.hand.size()).toBe(0);
  });

  it('puts the revealed top card into hand when it was named', async () => {
    const { testHarness, supplySilver } = setUp();

    testHarness.pickCard(supplySilver);
    await new Mystic(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.asCardArray().map((card) => card.getId())).toEqual(['silver-deck-0']);
    expect(testHarness.deck.size()).toBe(0);
  });

  it('leaves the revealed top card on the deck when a different card was named', async () => {
    const { testHarness, supplyGold } = setUp();

    testHarness.pickCard(supplyGold);
    await new Mystic(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.deck.asCardArray().map((card) => card.getId())).toEqual(['silver-deck-0']);
    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.stats.coins).toBe(2);
  });
});
