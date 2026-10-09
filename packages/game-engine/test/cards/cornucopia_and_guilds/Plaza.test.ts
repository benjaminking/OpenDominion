import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Plaza } from '../../../src/cards/cornucopia_and_guilds/Plaza';
import { CardHarness, createCardHarness } from '../testHarness';

const setUpCards = (testHarness: CardHarness) => {
  const estate = new Estate(testHarness.sharedGameState);
  estate.setId('estate-deck-0');
  testHarness.addToDeck(estate);
  const copper = new Copper(testHarness.sharedGameState);
  copper.setId('copper-hand-0');
  testHarness.addToHand(copper);
  return { estate, copper };
};

describe('Plaza', () => {
  it('gives +1 Card and +2 Actions, and +1 Coffers for discarding a Treasure', async () => {
    const testHarness = createCardHarness();
    const { estate, copper } = setUpCards(testHarness);

    testHarness.pickCard(copper);
    await new Plaza(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.hand.asCardArray()).toEqual([estate]);
    expect(testHarness.discard.asCardArray()).toEqual([copper]);
    expect(testHarness.stats.coffers).toBe(1);
  });

  it('gives no Coffers when no Treasure is discarded', async () => {
    const testHarness = createCardHarness();
    setUpCards(testHarness);

    await new Plaza(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.stats.coffers).toBe(0);
  });

  it('cannot discard a non-Treasure for Coffers', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-deck-0');
    testHarness.addToDeck(estate);

    testHarness.pickCard(estate);
    await new Plaza(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.asCardArray()).toEqual([estate]);
    expect(testHarness.stats.coffers).toBe(0);
  });
});
