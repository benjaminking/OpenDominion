import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Stables } from '../../../src/cards/hinterlands/Stables';
import { CardHarness, createCardHarness } from '../testHarness';

const addCoppersToDeck = (testHarness: CardHarness, numCoppers: number): void => {
  for (let i = 0; i < numCoppers; i++) {
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId(`copper-deck-${String(i)}`);
    testHarness.addToDeck(deckCopper);
  }
};

describe('Stables', () => {
  it('discarding a Treasure gives +3 Cards and +1 Action', async () => {
    const testHarness = createCardHarness();
    const handCopper = new Copper(testHarness.sharedGameState);
    handCopper.setId('copper-hand-0');
    testHarness.addToHand(handCopper);
    addCoppersToDeck(testHarness, 4);

    testHarness.pickCard(handCopper);
    await new Stables(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.asCardArray().map((card) => card.getId())).toEqual(['copper-hand-0']);
    expect(testHarness.hand.size()).toBe(3);
    expect(testHarness.deck.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(1);
  });

  it('does nothing if no Treasure is discarded', async () => {
    const testHarness = createCardHarness();
    const handCopper = new Copper(testHarness.sharedGameState);
    handCopper.setId('copper-hand-0');
    testHarness.addToHand(handCopper);
    addCoppersToDeck(testHarness, 4);

    await new Stables(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(0);
  });

  it('cannot discard a non-Treasure card', async () => {
    const testHarness = createCardHarness();
    const handEstate = new Estate(testHarness.sharedGameState);
    handEstate.setId('estate-hand-0');
    testHarness.addToHand(handEstate);
    addCoppersToDeck(testHarness, 4);

    testHarness.pickCard(handEstate);
    await new Stables(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(0);
  });
});
