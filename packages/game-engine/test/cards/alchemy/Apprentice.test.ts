import { describe, expect, it, vi } from 'vitest';

import { Card } from '../../../src/card/Card';
import { Apprentice } from '../../../src/cards/alchemy/Apprentice';
import { Familiar } from '../../../src/cards/alchemy/Familiar';
import { Vineyard } from '../../../src/cards/alchemy/Vineyard';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { CardHarness, createCardHarness } from '../testHarness';

const fillDeckWithCoppers = (testHarness: CardHarness, count: number): void => {
  for (let i = 0; i < count; i++) {
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId(`copper-deck-${String(i)}`);
    testHarness.addToDeck(copper);
  }
};

const cardIds = (cards: Iterable<Card>): string[] => Array.from(cards, (card) => card.getId());

describe('Apprentice', () => {
  it('gives +1 Action, trashes the chosen card and draws 1 card per $1 it costs', async () => {
    const testHarness = createCardHarness();
    fillDeckWithCoppers(testHarness, 6);
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-hand');
    testHarness.addToHand(silver);

    testHarness.pickCard(silver);
    await new Apprentice(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(cardIds(testHarness.sharedTrash)).toEqual([silver.getId()]);
    expect(testHarness.hand.size()).toBe(3);
    expect(testHarness.hand.contains(silver)).toBe(false);
    expect(testHarness.deck.size()).toBe(3);
  });

  it('draws 2 extra cards when the trashed card has a Potion in its cost', async () => {
    const testHarness = createCardHarness();
    fillDeckWithCoppers(testHarness, 7);
    const familiar = new Familiar(testHarness.sharedGameState);
    familiar.setId('familiar-hand');
    testHarness.addToHand(familiar);

    testHarness.pickCard(familiar);
    await new Apprentice(testHarness.sharedGameState).play(testHarness.executor);

    // Familiar costs $3P: 3 + 2 cards
    expect(cardIds(testHarness.sharedTrash)).toEqual([familiar.getId()]);
    expect(testHarness.hand.size()).toBe(5);
    expect(testHarness.deck.size()).toBe(2);
  });

  it('draws only the 2 Potion cards for a card costing $0P', async () => {
    const testHarness = createCardHarness();
    fillDeckWithCoppers(testHarness, 4);
    const vineyard = new Vineyard(testHarness.sharedGameState);
    vineyard.setId('vineyard-hand');
    testHarness.addToHand(vineyard);

    testHarness.pickCard(vineyard);
    await new Apprentice(testHarness.sharedGameState).play(testHarness.executor);

    expect(cardIds(testHarness.sharedTrash)).toEqual([vineyard.getId()]);
    expect(testHarness.hand.size()).toBe(2);
  });

  it("uses the trashed card's current cost", async () => {
    const testHarness = createCardHarness();
    fillDeckWithCoppers(testHarness, 6);
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-hand');
    testHarness.addToHand(silver);
    // e.g. a Bridge was played this turn
    vi.mocked(testHarness.sharedGameState.cost).mockImplementation((card) => card.getOriginalCost().minus(1));

    testHarness.pickCard(silver);
    await new Apprentice(testHarness.sharedGameState).play(testHarness.executor);

    expect(cardIds(testHarness.sharedTrash)).toEqual([silver.getId()]);
    expect(testHarness.hand.size()).toBe(2);
  });

  it('draws nothing when trashing a card costing $0', async () => {
    const testHarness = createCardHarness();
    fillDeckWithCoppers(testHarness, 3);
    const handCopper = new Copper(testHarness.sharedGameState);
    handCopper.setId('copper-hand');
    testHarness.addToHand(handCopper);

    testHarness.pickCard(handCopper);
    await new Apprentice(testHarness.sharedGameState).play(testHarness.executor);

    expect(cardIds(testHarness.sharedTrash)).toEqual([handCopper.getId()]);
    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.deck.size()).toBe(3);
  });

  it('only gives +1 Action when the hand is empty', async () => {
    const testHarness = createCardHarness();
    fillDeckWithCoppers(testHarness, 3);

    await new Apprentice(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.deck.size()).toBe(3);
  });
});
