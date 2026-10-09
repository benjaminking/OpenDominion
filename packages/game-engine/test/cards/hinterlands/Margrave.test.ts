import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Margrave } from '../../../src/cards/hinterlands/Margrave';
import { createCardHarness } from '../testHarness';

describe('Margrave', () => {
  it('draws 3 cards and adds a buy', async () => {
    const testHarness = createCardHarness();
    for (let i = 0; i < 4; i++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(i)}`);
      testHarness.addToDeck(deckCopper);
    }

    await new Margrave(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(3);
    expect(testHarness.deck.size()).toBe(1);
    expect(testHarness.stats.buys).toBe(1);
  });

  it('makes each other player draw a card, then discard down to 3 cards', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    testHarness.routeAttacksTo(targetHarness);
    const targetHandCards: Copper[] = [];
    for (let i = 0; i < 4; i++) {
      const targetCopper = new Copper(targetHarness.sharedGameState);
      targetCopper.setId(`copper-target-hand-${String(i)}`);
      targetHarness.addToHand(targetCopper);
      targetHandCards.push(targetCopper);
    }
    const targetDeckEstate = new Estate(targetHarness.sharedGameState);
    targetDeckEstate.setId('estate-target-deck-0');
    targetHarness.addToDeck(targetDeckEstate);

    targetHarness.pickCards([targetDeckEstate, targetHandCards[0]]);
    await new Margrave(testHarness.sharedGameState).play(testHarness.executor);

    expect(targetHarness.deck.size()).toBe(0);
    expect(targetHarness.hand.size()).toBe(3);
    expect(targetHarness.discard.size()).toBe(2);
    expect(targetHarness.discard.contains(targetDeckEstate)).toBe(true);
  });

  it('does not make other players discard when they have 3 cards after drawing', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    testHarness.routeAttacksTo(targetHarness);
    for (let i = 0; i < 2; i++) {
      const targetCopper = new Copper(targetHarness.sharedGameState);
      targetCopper.setId(`copper-target-hand-${String(i)}`);
      targetHarness.addToHand(targetCopper);
    }
    const targetDeckCopper = new Copper(targetHarness.sharedGameState);
    targetDeckCopper.setId('copper-target-deck-0');
    targetHarness.addToDeck(targetDeckCopper);

    await new Margrave(testHarness.sharedGameState).play(testHarness.executor);

    expect(targetHarness.hand.size()).toBe(3);
    expect(targetHarness.discard.size()).toBe(0);
  });
});
