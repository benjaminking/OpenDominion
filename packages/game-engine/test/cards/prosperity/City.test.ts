import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { City } from '../../../src/cards/prosperity/City';
import { CardHarness, createCardHarness } from '../testHarness';

const setUpHarness = (numEmptySupplyPiles: number): CardHarness => {
  const testHarness = createCardHarness();
  (testHarness.sharedGameState.piles as unknown as { numEmptySupplyPiles: number }).numEmptySupplyPiles =
    numEmptySupplyPiles;
  for (let cardIndex = 0; cardIndex < 4; cardIndex++) {
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId(`copper-deck-${String(cardIndex)}`);
    testHarness.addToDeck(deckCopper);
  }
  return testHarness;
};

describe('City', () => {
  it('draws 1 card and adds 2 actions when no Supply pile is empty', async () => {
    const testHarness = setUpHarness(0);

    await new City(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.stats.buys).toBe(0);
    expect(testHarness.stats.coins).toBe(0);
  });

  it('draws an extra card when one Supply pile is empty', async () => {
    const testHarness = setUpHarness(1);

    await new City(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.stats.buys).toBe(0);
    expect(testHarness.stats.coins).toBe(0);
  });

  it('also adds +1 Buy and +$1 when two or more Supply piles are empty', async () => {
    const testHarness = setUpHarness(3);

    await new City(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.stats.buys).toBe(1);
    expect(testHarness.stats.coins).toBe(1);
  });
});
