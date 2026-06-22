import { describe, expect, it, vi } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Conspirator } from '../../../src/cards/intrigue/Conspirator';
import { createCardHarness } from '../testHarness';

describe('Conspirator', () => {
  it('adds 2 coins', async () => {
    const testHarness = createCardHarness();
    await new Conspirator(testHarness.sharedGameState).play(testHarness.executor);
    expect(testHarness.stats.coins).toBe(2);
  });

  it('draws 1 card and adds 1 action when 3+ action cards have been played this turn', async () => {
    const testHarness = createCardHarness();
    for (let i = 0; i < 5; i++) {
      const deckCard = new Copper(testHarness.sharedGameState);
      deckCard.setId(`deck-copper-${String(i)}`);
      testHarness.addToDeck(deckCard);
    }
    testHarness.turnTracker.numMatchingCardsPlayedThisTurn = vi.fn(() => 3);

    await new Conspirator(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(1);
  });

  it('does not draw when fewer than 3 action cards played this turn', async () => {
    const testHarness = createCardHarness();
    // default: numMatchingCardsPlayedThisTurn returns 0
    await new Conspirator(testHarness.sharedGameState).play(testHarness.executor);
    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.stats.actions).toBe(0);
  });
});
