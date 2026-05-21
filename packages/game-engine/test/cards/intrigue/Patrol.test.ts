import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Curse } from '../../../src/cards/basic_cards/Curse';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Patrol } from '../../../src/cards/intrigue/Patrol';
import { createCardHarness } from '../testHarness';

describe('Patrol', () => {
  it('draws 3 cards', async () => {
    const testHarness = createCardHarness();
    // 3 draw cards + 4 reveal cards
    for (let i = 0; i < 3; i++) {
      const drawCard = new Copper(testHarness.sharedGameState);
      drawCard.setId(`draw-copper-${String(i)}`);
      testHarness.addToDeck(drawCard);
    }
    const revealCards: Copper[] = [];
    for (let i = 0; i < 4; i++) {
      const revealedCard = new Copper(testHarness.sharedGameState);
      revealedCard.setId(`revealed-copper-${String(i)}`);
      revealCards.push(revealedCard);
      testHarness.addToDeck(revealedCard);
    }

    // topDeckCardsFromRevealedSet picks each remaining card (all Coppers, no match)
    // Provide one pickCard per remaining card in reveal set
    for (const revealCard of revealCards) {
      testHarness.pickCard(revealCard);
    }
    await new Patrol(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(3);
    expect(testHarness.deck.size()).toBe(4); // all 4 reveal cards topdecked
  });

  it('puts victory cards and curses into hand from top 4 deck cards', async () => {
    const testHarness = createCardHarness();
    for (let i = 0; i < 3; i++) {
      const drawCard = new Copper(testHarness.sharedGameState);
      drawCard.setId(`draw-copper-${String(i)}`);
      testHarness.addToDeck(drawCard);
    }
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-on-deck');
    const curse = new Curse(testHarness.sharedGameState);
    curse.setId('curse-0');
    const revealedCopper = new Copper(testHarness.sharedGameState);
    revealedCopper.setId('revealed-copper');
    // Add to deck in LIFO order: copper1, curse, estate are top 3
    testHarness.addToDeck(revealedCopper);
    testHarness.addToDeck(curse);
    testHarness.addToDeck(estate); // top of deck

    // Patrol draws 3 first, then reveals top 4
    // Estate and Curse go to hand automatically
    // copper1 needs to be topdecked: pickCard for it
    testHarness.pickCard(revealedCopper);
    await new Patrol(testHarness.sharedGameState).play(testHarness.executor);

    // Estate and Curse were put to hand; copper1 topdecked
    // hand has 3 drawn + estate + curse = 5
    expect(testHarness.hand.asCardArray().some((card) => card.getName() === 'Estate')).toBe(true);
    expect(testHarness.hand.asCardArray().some((card) => card.getName() === 'Curse')).toBe(true);
  });
});
