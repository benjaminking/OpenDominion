import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { SeaChart } from '../../../src/cards/seaside/SeaChart';
import { createCardHarness } from '../testHarness';

describe('SeaChart', () => {
  it('draws 1 card and adds 1 action', async () => {
    const testHarness = createCardHarness();
    for (let i = 0; i < 2; i++) {
      const deckCard = new Copper(testHarness.sharedGameState);
      deckCard.setId(`deck-copper-${String(i)}`);
      testHarness.addToDeck(deckCard);
    }

    await new SeaChart(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(1);
  });

  it('draws the top card into hand when a copy is already in play', async () => {
    const testHarness = createCardHarness();
    // card to draw
    const drawCard = new Copper(testHarness.sharedGameState);
    drawCard.setId('draw-copper');
    testHarness.addToDeck(drawCard);
    // top card that matches something in play
    const topDeckCard = new Copper(testHarness.sharedGameState);
    topDeckCard.setId('top-deck-copper');
    testHarness.addToDeck(topDeckCard);
    // put a copy of topCard in play
    const inPlayCopy = new Copper(testHarness.sharedGameState);
    inPlayCopy.setId('in-play');
    testHarness.addToInPlay(inPlayCopy);

    await new SeaChart(testHarness.sharedGameState).play(testHarness.executor);

    // drew 1 (draw) + topCard via match
    expect(testHarness.hand.size()).toBe(2);
  });
});
