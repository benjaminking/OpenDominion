import { describe, expect, it } from 'vitest';

import { ThroneRoom } from '../../../src/cards/base_game/ThroneRoom';
import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { createCardHarness } from '../testHarness';

describe('ThroneRoom', () => {
  it('plays the chosen card twice', async () => {
    const testHarness = createCardHarness();
    // Add a Village to hand (action card) and cards to deck to draw
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-0');
    testHarness.addToHand(village);
    for (let cardIndex = 0; cardIndex < 4; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }

    testHarness.pickCard(village);
    await new ThroneRoom(testHarness.sharedGameState).play(testHarness.executor);

    // Village draws 1 and gives +2 actions, played twice → 2 cards drawn, +4 actions
    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.stats.actions).toBe(4);
  });

  it('does nothing when no card is chosen', async () => {
    const testHarness = createCardHarness();
    // default: choice returns none
    await new ThroneRoom(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(0);
  });
});
