import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Madman } from '../../../src/cards/dark_ages/Madman';
import { createCardHarness } from '../testHarness';

const setUp = (numHandCards: number, numDeckCards: number) => {
  const testHarness = createCardHarness();
  testHarness.pileCards.set('Madman', []);
  const madman = new Madman(testHarness.sharedGameState);
  madman.setId('madman-in-play');
  testHarness.addToInPlay(madman);
  for (let i = 0; i < numHandCards; i++) {
    const handCopper = new Copper(testHarness.sharedGameState);
    handCopper.setId(`copper-hand-${String(i)}`);
    testHarness.addToHand(handCopper);
  }
  for (let i = 0; i < numDeckCards; i++) {
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId(`copper-deck-${String(i)}`);
    testHarness.addToDeck(deckCopper);
  }
  return { testHarness, madman };
};

describe('Madman', () => {
  // BUG: Piles.returnCardToPile never sets the returned card's location to Pile
  it('gives +2 Actions, returns itself to the Madman pile and draws a card per card in hand', async () => {
    const { testHarness, madman } = setUp(3, 5);

    await madman.play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.inPlay.size()).toBe(0);
    expect(testHarness.pileCards.get('Madman')?.map((card) => card.getId())).toEqual(['madman-in-play']);
    expect(madman.getLocation()).toBe(CardLocation.PILE);
    expect(testHarness.hand.size()).toBe(6);
    expect(testHarness.deck.size()).toBe(2);
  });

  it('returns itself but draws nothing with an empty hand', async () => {
    const { testHarness, madman } = setUp(0, 3);

    await madman.play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.pileCards.get('Madman')?.map((card) => card.getId())).toEqual(['madman-in-play']);
    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.deck.size()).toBe(3);
  });

  it('draws nothing when it cannot be returned to the pile', async () => {
    const { testHarness, madman } = setUp(2, 3);
    testHarness.sharedGameState.blockCardFromMoving(madman);

    await madman.play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.inPlay.asCardArray().map((card) => card.getId())).toEqual(['madman-in-play']);
    expect(testHarness.pileCards.get('Madman')).toHaveLength(0);
    expect(testHarness.hand.size()).toBe(2);
  });

  // BUG: returnCardToPileFromLocation returns the card even when it was not at that location, so a replay redraws
  it('gives +2 Actions but draws nothing when played again after it was already returned (e.g. Throne Room)', async () => {
    const { testHarness, madman } = setUp(2, 10);

    await madman.play(testHarness.executor);
    await madman.play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(4);
    expect(testHarness.hand.size()).toBe(4);
    expect(testHarness.pileCards.get('Madman')?.map((card) => card.getId())).toEqual(['madman-in-play']);
  });
});
