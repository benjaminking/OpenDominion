import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { SpiceMerchant } from '../../../src/cards/hinterlands/SpiceMerchant';
import { CardHarness, createCardHarness } from '../testHarness';

const setUpCopperInHandAndDeck = (testHarness: CardHarness): Copper => {
  const handCopper = new Copper(testHarness.sharedGameState);
  handCopper.setId('copper-hand-0');
  testHarness.addToHand(handCopper);
  for (let i = 0; i < 3; i++) {
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId(`copper-deck-${String(i)}`);
    testHarness.addToDeck(deckCopper);
  }
  return handCopper;
};

describe('SpiceMerchant', () => {
  it('trashing a Treasure can give +2 Cards and +1 Action', async () => {
    const testHarness = createCardHarness();
    const handCopper = setUpCopperInHandAndDeck(testHarness);

    testHarness.pickCard(handCopper);
    testHarness.pickOption('+2 Cards and +1 Action');
    await new SpiceMerchant(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.contains(handCopper)).toBe(true);
    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.stats.buys).toBe(0);
    expect(testHarness.stats.coins).toBe(0);
  });

  it('trashing a Treasure can give +1 Buy and +$2', async () => {
    const testHarness = createCardHarness();
    const handCopper = setUpCopperInHandAndDeck(testHarness);

    testHarness.pickCard(handCopper);
    testHarness.pickOption('+1 Buy and +$2');
    await new SpiceMerchant(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.contains(handCopper)).toBe(true);
    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.stats.buys).toBe(1);
    expect(testHarness.stats.coins).toBe(2);
    expect(testHarness.stats.actions).toBe(0);
  });

  it('does nothing if no Treasure is trashed', async () => {
    const testHarness = createCardHarness();
    setUpCopperInHandAndDeck(testHarness);

    await new SpiceMerchant(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(0);
    expect(testHarness.stats.coins).toBe(0);
  });

  it('cannot trash a non-Treasure card', async () => {
    const testHarness = createCardHarness();
    const handEstate = new Estate(testHarness.sharedGameState);
    handEstate.setId('estate-hand-0');
    testHarness.addToHand(handEstate);

    testHarness.pickCard(handEstate);
    await new SpiceMerchant(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.hand.contains(handEstate)).toBe(true);
  });
});
