import { describe, expect, it } from 'vitest';

import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { ShantyTown } from '../../../src/cards/intrigue/ShantyTown';
import { createCardHarness } from '../testHarness';

describe('ShantyTown', () => {
  it('adds 2 actions and draws 2 when hand has no action cards', async () => {
    const testHarness = createCardHarness();
    for (let i = 0; i < 4; i++) {
      const deckCard = new Copper(testHarness.sharedGameState);
      deckCard.setId(`deck-copper-${String(i)}`);
      testHarness.addToDeck(deckCard);
    }

    await new ShantyTown(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.hand.size()).toBe(2);
  });

  it('adds 2 actions but does not draw when hand has an action card', async () => {
    const testHarness = createCardHarness();
    for (let i = 0; i < 4; i++) {
      const deckCard = new Copper(testHarness.sharedGameState);
      deckCard.setId(`deck-copper-${String(i)}`);
      testHarness.addToDeck(deckCard);
    }
    const village = new Village(testHarness.sharedGameState);
    village.setId('v-0');
    testHarness.addToHand(village);

    await new ShantyTown(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.hand.size()).toBe(1); // no cards drawn
  });
});
