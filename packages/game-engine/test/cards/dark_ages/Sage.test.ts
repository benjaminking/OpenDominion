import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Card } from '../../../src/card/Card';
import { CardCollection } from '../../../src/card/CardCollection';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Sage } from '../../../src/cards/dark_ages/Sage';
import { CardHarness, createCardHarness } from '../testHarness';

const withId = <T extends Card>(card: T, id: string): T => {
  card.setId(id);
  return card;
};

const idsOf = (cards: CardCollection): string[] => cards.asCardArray().map((card) => card.getId());

// Cards are listed top-first.
const stackDeck = (harness: CardHarness, cards: Card[]): void => {
  for (const card of [...cards].reverse()) {
    harness.addToDeck(card);
  }
};

describe('Sage', () => {
  it('gives +1 Action, puts the first revealed card costing $3 or more into hand and discards the rest', async () => {
    const testHarness = createCardHarness();
    stackDeck(testHarness, [
      withId(new Copper(testHarness.sharedGameState), 'copper-deck-0'),
      withId(new Estate(testHarness.sharedGameState), 'estate-deck-1'),
      withId(new Silver(testHarness.sharedGameState), 'silver-deck-2'),
      withId(new Gold(testHarness.sharedGameState), 'gold-deck-3'),
    ]);

    await new Sage(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(idsOf(testHarness.hand)).toEqual(['silver-deck-2']);
    expect(idsOf(testHarness.discard)).toEqual(['copper-deck-0', 'estate-deck-1']);
    expect(idsOf(testHarness.deck)).toEqual(['gold-deck-3']);
  });

  // BUG: putCardsIntoHandFromLocation only removes cards that are NOT at the location, so it stays in the reveal zone
  it('moves the card into hand rather than leaving a copy among the revealed cards', async () => {
    const testHarness = createCardHarness();
    stackDeck(testHarness, [
      withId(new Copper(testHarness.sharedGameState), 'copper-deck-0'),
      withId(new Silver(testHarness.sharedGameState), 'silver-deck-1'),
    ]);

    await new Sage(testHarness.sharedGameState).play(testHarness.executor);

    expect(idsOf(testHarness.hand)).toEqual(['silver-deck-1']);
    expect(testHarness.ownedCards.getCardsFromArea(CardLocation.REVEAL_LIMBO).size()).toBe(0);
  });

  it('discards everything revealed when no card costs $3 or more', async () => {
    const testHarness = createCardHarness();
    stackDeck(testHarness, [
      withId(new Copper(testHarness.sharedGameState), 'copper-deck-0'),
      withId(new Estate(testHarness.sharedGameState), 'estate-deck-1'),
    ]);

    await new Sage(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.hand.size()).toBe(0);
    expect(idsOf(testHarness.discard)).toEqual(['copper-deck-0', 'estate-deck-1']);
    expect(testHarness.deck.size()).toBe(0);
  });
});
