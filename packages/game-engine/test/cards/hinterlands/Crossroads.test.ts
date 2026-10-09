import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Crossroads } from '../../../src/cards/hinterlands/Crossroads';
import { CardHarness, createCardHarness } from '../testHarness';

const addCoppersToDeck = (testHarness: CardHarness, numCoppers: number): void => {
  for (let i = 0; i < numCoppers; i++) {
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId(`copper-deck-${String(i)}`);
    testHarness.addToDeck(deckCopper);
  }
};

describe('Crossroads', () => {
  it('draws a card per Victory card in hand and gives +3 Actions the first time', async () => {
    const testHarness = createCardHarness();
    for (let i = 0; i < 2; i++) {
      const handEstate = new Estate(testHarness.sharedGameState);
      handEstate.setId(`estate-hand-${String(i)}`);
      testHarness.addToHand(handEstate);
    }
    const handCopper = new Copper(testHarness.sharedGameState);
    handCopper.setId('copper-hand-0');
    testHarness.addToHand(handCopper);
    addCoppersToDeck(testHarness, 3);
    const crossroads = new Crossroads(testHarness.sharedGameState);
    crossroads.setId('crossroads-0');
    testHarness.addToHand(crossroads);
    testHarness.stats.actions = 1;

    await testHarness.executor.playCardFromHand(crossroads);

    expect(testHarness.hand.size()).toBe(5);
    expect(testHarness.deck.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(3);
  });

  it('draws nothing with no Victory cards in hand', async () => {
    const testHarness = createCardHarness();
    const handCopper = new Copper(testHarness.sharedGameState);
    handCopper.setId('copper-hand-0');
    testHarness.addToHand(handCopper);
    addCoppersToDeck(testHarness, 3);
    const crossroads = new Crossroads(testHarness.sharedGameState);
    crossroads.setId('crossroads-0');
    testHarness.addToHand(crossroads);

    await testHarness.executor.playCardFromHand(crossroads);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.deck.size()).toBe(3);
  });

  it('does not give +3 Actions for a second Crossroads played this turn', async () => {
    const testHarness = createCardHarness();
    const firstCrossroads = new Crossroads(testHarness.sharedGameState);
    firstCrossroads.setId('crossroads-0');
    testHarness.addToHand(firstCrossroads);
    const secondCrossroads = new Crossroads(testHarness.sharedGameState);
    secondCrossroads.setId('crossroads-1');
    testHarness.addToHand(secondCrossroads);
    testHarness.stats.actions = 1;

    await testHarness.executor.playCardFromHand(firstCrossroads);
    expect(testHarness.stats.actions).toBe(3);
    await testHarness.executor.playCardFromHand(secondCrossroads);

    expect(testHarness.stats.actions).toBe(2);
  });
});
