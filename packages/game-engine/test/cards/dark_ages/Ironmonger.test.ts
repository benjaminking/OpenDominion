import { describe, expect, it } from 'vitest';

import { Card } from '../../../src/card/Card';
import { CardCollection } from '../../../src/card/CardCollection';
import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Ironmonger } from '../../../src/cards/dark_ages/Ironmonger';
import { Mill } from '../../../src/cards/intrigue/Mill';
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

describe('Ironmonger', () => {
  it('gives +1 Card and +1 Action; a Treasure on top gives +$1 and may be kept there', async () => {
    const testHarness = createCardHarness();
    const drawnCopper = withId(new Copper(testHarness.sharedGameState), 'copper-deck-0');
    const topSilver = withId(new Silver(testHarness.sharedGameState), 'silver-deck-1');
    stackDeck(testHarness, [drawnCopper, topSilver]);

    testHarness.pickOption('No, keep it on top');
    await new Ironmonger(testHarness.sharedGameState).play(testHarness.executor);

    expect(idsOf(testHarness.hand)).toEqual(['copper-deck-0']);
    expect(idsOf(testHarness.deck)).toEqual(['silver-deck-1']);
    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.stats.coins).toBe(1);
  });

  it('an Action card on top gives +1 Action even when discarded', async () => {
    const testHarness = createCardHarness();
    const drawnCopper = withId(new Copper(testHarness.sharedGameState), 'copper-deck-0');
    const topVillage = withId(new Village(testHarness.sharedGameState), 'village-deck-1');
    stackDeck(testHarness, [drawnCopper, topVillage]);

    testHarness.pickOption('Yes, discard it');
    await new Ironmonger(testHarness.sharedGameState).play(testHarness.executor);

    expect(idsOf(testHarness.discard)).toEqual(['village-deck-1']);
    expect(testHarness.deck.size()).toBe(0);
    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.stats.coins).toBe(0);
  });

  it('a discarded Victory card gives +1 Card, drawing the next card', async () => {
    const testHarness = createCardHarness();
    const drawnCopper = withId(new Copper(testHarness.sharedGameState), 'copper-deck-0');
    const topEstate = withId(new Estate(testHarness.sharedGameState), 'estate-deck-1');
    const nextSilver = withId(new Silver(testHarness.sharedGameState), 'silver-deck-2');
    stackDeck(testHarness, [drawnCopper, topEstate, nextSilver]);

    testHarness.pickOption('Yes, discard it');
    await new Ironmonger(testHarness.sharedGameState).play(testHarness.executor);

    expect(idsOf(testHarness.hand)).toEqual(['copper-deck-0', 'silver-deck-2']);
    expect(idsOf(testHarness.discard)).toEqual(['estate-deck-1']);
    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.stats.coins).toBe(0);
  });

  it('a Victory card kept on top is drawn by its +1 Card', async () => {
    const testHarness = createCardHarness();
    const drawnCopper = withId(new Copper(testHarness.sharedGameState), 'copper-deck-0');
    const topEstate = withId(new Estate(testHarness.sharedGameState), 'estate-deck-1');
    stackDeck(testHarness, [drawnCopper, topEstate]);

    testHarness.pickOption('No, keep it on top');
    await new Ironmonger(testHarness.sharedGameState).play(testHarness.executor);

    expect(idsOf(testHarness.hand)).toEqual(['copper-deck-0', 'estate-deck-1']);
    expect(testHarness.deck.size()).toBe(0);
  });

  it('a card with several types gives each matching bonus', async () => {
    const testHarness = createCardHarness();
    const drawnCopper = withId(new Copper(testHarness.sharedGameState), 'copper-deck-0');
    const topMill = withId(new Mill(testHarness.sharedGameState), 'mill-deck-1');
    const nextSilver = withId(new Silver(testHarness.sharedGameState), 'silver-deck-2');
    stackDeck(testHarness, [drawnCopper, topMill, nextSilver]);

    testHarness.pickOption('Yes, discard it');
    await new Ironmonger(testHarness.sharedGameState).play(testHarness.executor);

    // Mill is an Action-Victory: +1 Action and +1 Card, but no +$1
    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.stats.coins).toBe(0);
    expect(idsOf(testHarness.hand)).toEqual(['copper-deck-0', 'silver-deck-2']);
  });

  it('only gives +1 Card and +1 Action when there is nothing left to reveal', async () => {
    const testHarness = createCardHarness();
    testHarness.addToDeck(withId(new Copper(testHarness.sharedGameState), 'copper-deck-0'));

    await new Ironmonger(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.stats.coins).toBe(0);
    expect(testHarness.decisionService.chooseOneOption).not.toHaveBeenCalled();
  });

  it('shuffles the discard pile to reveal a card when the draw empties the deck', async () => {
    const testHarness = createCardHarness();
    testHarness.addToDeck(withId(new Copper(testHarness.sharedGameState), 'copper-deck-0'));
    testHarness.addToDiscard(withId(new Estate(testHarness.sharedGameState), 'estate-discard-0'));

    testHarness.pickOption('No, keep it on top');
    await new Ironmonger(testHarness.sharedGameState).play(testHarness.executor);

    // The revealed Estate is a Victory card: +1 Card draws it
    expect(idsOf(testHarness.hand)).toEqual(['copper-deck-0', 'estate-discard-0']);
    expect(testHarness.deck.size()).toBe(0);
    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.stats.actions).toBe(1);
  });

  it('draws a discarded Victory card back after reshuffling when no other card is left', async () => {
    const testHarness = createCardHarness();
    const drawnCopper = withId(new Copper(testHarness.sharedGameState), 'copper-deck-0');
    const topEstate = withId(new Estate(testHarness.sharedGameState), 'estate-deck-1');
    stackDeck(testHarness, [drawnCopper, topEstate]);

    testHarness.pickOption('Yes, discard it');
    await new Ironmonger(testHarness.sharedGameState).play(testHarness.executor);

    expect(idsOf(testHarness.hand)).toEqual(['copper-deck-0', 'estate-deck-1']);
    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.deck.size()).toBe(0);
  });
});
