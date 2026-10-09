import { CardType } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { RuinedLibrary } from '../../../src/cards/dark_ages/RuinedLibrary';
import { createCardHarness } from '../testHarness';

describe('RuinedLibrary', () => {
  it('gives +1 Card', async () => {
    const testHarness = createCardHarness();
    for (let i = 0; i < 2; i++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(i)}`);
      testHarness.addToDeck(deckCopper);
    }

    await new RuinedLibrary(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.deck.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(0);
  });

  it('is an Action-Ruins from the Ruins pile', () => {
    const testHarness = createCardHarness();
    const ruinedLibrary = new RuinedLibrary(testHarness.sharedGameState);

    expect(ruinedLibrary.hasType(CardType.ACTION)).toBe(true);
    expect(ruinedLibrary.hasType(CardType.RUINS)).toBe(true);
    expect(ruinedLibrary.getPileName()).toBe('Ruins');
  });
});
