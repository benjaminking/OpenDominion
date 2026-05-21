import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Nobles } from '../../../src/cards/intrigue/Nobles';
import { createCardHarness } from '../testHarness';

describe('Nobles', () => {
  it('draws 3 cards when +3 Cards is chosen', async () => {
    const testHarness = createCardHarness();
    for (let i = 0; i < 5; i++) {
      const deckCard = new Copper(testHarness.sharedGameState);
      deckCard.setId(`deck-copper-${String(i)}`);
      testHarness.addToDeck(deckCard);
    }

    testHarness.pickOption('+3 Cards');
    await new Nobles(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(3);
  });

  it('adds 2 actions when +2 Actions is chosen', async () => {
    const testHarness = createCardHarness();
    testHarness.pickOption('+2 Actions');
    await new Nobles(testHarness.sharedGameState).play(testHarness.executor);
    expect(testHarness.stats.actions).toBe(2);
  });

  it('scores 2 VP', () => {
    const testHarness = createCardHarness();
    expect(new Nobles(testHarness.sharedGameState).score([])).toBe(2);
  });
});
