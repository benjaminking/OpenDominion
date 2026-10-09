import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { GrandMarket } from '../../../src/cards/prosperity/GrandMarket';
import { createCardHarness } from '../testHarness';

describe('GrandMarket', () => {
  it('draws 1 card and adds 1 action, 1 buy and $2', async () => {
    const testHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 2; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }

    await new GrandMarket(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.deck.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.stats.buys).toBe(1);
    expect(testHarness.stats.coins).toBe(2);
  });

  it('can be bought when no Copper is in play', () => {
    const testHarness = createCardHarness();
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-in-play-0');
    testHarness.addToInPlay(silver);
    // Coppers in hand don't matter
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-hand-0');
    testHarness.addToHand(copper);

    expect(new GrandMarket(testHarness.sharedGameState).canBeBought(testHarness.executor)).toBe(true);
  });

  it('cannot be bought with a Copper in play', () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-in-play-0');
    testHarness.addToInPlay(copper);

    expect(new GrandMarket(testHarness.sharedGameState).canBeBought(testHarness.executor)).toBe(false);
  });
});
