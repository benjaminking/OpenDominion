import { describe, expect, it } from 'vitest';

import { CardCollection } from '../../../src/card/CardCollection';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Curse } from '../../../src/cards/basic_cards/Curse';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Storeroom } from '../../../src/cards/dark_ages/Storeroom';
import { createCardHarness } from '../testHarness';

const idsOf = (cards: CardCollection): string[] => cards.asCardArray().map((card) => card.getId());

const setUp = () => {
  const testHarness = createCardHarness();
  const handEstate = new Estate(testHarness.sharedGameState);
  handEstate.setId('estate-hand-0');
  const handCurse = new Curse(testHarness.sharedGameState);
  handCurse.setId('curse-hand-1');
  const handCopper = new Copper(testHarness.sharedGameState);
  handCopper.setId('copper-hand-2');
  const handSilver = new Silver(testHarness.sharedGameState);
  handSilver.setId('silver-hand-3');
  for (const handCard of [handEstate, handCurse, handCopper, handSilver]) {
    testHarness.addToHand(handCard);
  }
  for (let i = 0; i < 3; i++) {
    const deckGold = new Gold(testHarness.sharedGameState);
    deckGold.setId(`gold-deck-${String(i)}`);
    testHarness.addToDeck(deckGold);
  }
  return { testHarness, handEstate, handCurse, handCopper, handSilver };
};

describe('Storeroom', () => {
  it('gives +1 Buy, draws a card per card discarded, then gives +$1 per further card discarded', async () => {
    const { testHarness, handEstate, handCurse, handCopper, handSilver } = setUp();

    testHarness.pickCards([handEstate, handCurse]);
    testHarness.pickCards([handCopper, handSilver]);
    await new Storeroom(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.buys).toBe(1);
    expect(idsOf(testHarness.hand)).toEqual(['gold-deck-2', 'gold-deck-1']);
    expect(testHarness.deck.size()).toBe(1);
    expect(idsOf(testHarness.discard)).toEqual(['estate-hand-0', 'curse-hand-1', 'copper-hand-2', 'silver-hand-3']);
    expect(testHarness.stats.coins).toBe(2);
  });

  it('can discard only for coins', async () => {
    const { testHarness, handCopper, handSilver } = setUp();

    testHarness.pickCards([]);
    testHarness.pickCards([handCopper, handSilver]);
    await new Storeroom(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.deck.size()).toBe(3);
    expect(testHarness.stats.coins).toBe(2);
  });

  it('only gives +1 Buy when nothing is discarded', async () => {
    const { testHarness } = setUp();

    await new Storeroom(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.buys).toBe(1);
    expect(testHarness.hand.size()).toBe(4);
    expect(testHarness.deck.size()).toBe(3);
    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.stats.coins).toBe(0);
  });
});
