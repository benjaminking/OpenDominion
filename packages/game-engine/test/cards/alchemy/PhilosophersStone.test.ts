import { CardType } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { PhilosophersStone } from '../../../src/cards/alchemy/PhilosophersStone';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { CardHarness, createCardHarness } from '../testHarness';

const addCoppers = (testHarness: CardHarness, zone: 'deck' | 'discard' | 'hand' | 'inPlay', count: number): void => {
  for (let i = 0; i < count; i++) {
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId(`copper-${zone}-${String(i)}`);
    if (zone === 'deck') testHarness.addToDeck(copper);
    else if (zone === 'discard') testHarness.addToDiscard(copper);
    else if (zone === 'hand') testHarness.addToHand(copper);
    else testHarness.addToInPlay(copper);
  }
};

describe("Philosopher's Stone", () => {
  it('is a Treasure costing $3P', () => {
    const testHarness = createCardHarness();
    const philosophersStone = new PhilosophersStone(testHarness.sharedGameState);

    expect(philosophersStone.hasType(CardType.TREASURE)).toBe(true);
    expect(philosophersStone.getCost().coins).toBe(3);
    expect(philosophersStone.getCost().potions).toBe(1);
  });

  it('gives +$1 per 5 cards between deck and discard pile, rounded down', async () => {
    const testHarness = createCardHarness();
    addCoppers(testHarness, 'deck', 7);
    addCoppers(testHarness, 'discard', 7);

    await new PhilosophersStone(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(2);
    expect(testHarness.deck.size()).toBe(7);
    expect(testHarness.discard.size()).toBe(7);
  });

  it('gives exactly +$1 for 5 cards', async () => {
    const testHarness = createCardHarness();
    addCoppers(testHarness, 'discard', 5);

    await new PhilosophersStone(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(1);
  });

  it('does not count cards in hand or in play', async () => {
    const testHarness = createCardHarness();
    addCoppers(testHarness, 'deck', 4);
    addCoppers(testHarness, 'hand', 5);
    addCoppers(testHarness, 'inPlay', 5);

    await new PhilosophersStone(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(0);
  });
});
