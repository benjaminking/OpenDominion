import { describe, expect, it, vi } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Duchy } from '../../../src/cards/basic_cards/Duchy';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Cartographer } from '../../../src/cards/hinterlands/Cartographer';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { CardHarness, createCardHarness } from '../testHarness';

const addCoppersToDeck = (testHarness: CardHarness, numCoppers: number): void => {
  for (let i = 0; i < numCoppers; i++) {
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId(`copper-deck-${String(i)}`);
    testHarness.addToDeck(deckCopper);
  }
};

describe('Cartographer', () => {
  it('draws a card, adds an action, discards chosen cards from the top 4 and puts the rest back in order', async () => {
    const testHarness = createCardHarness();
    const bottomCopper = new Copper(testHarness.sharedGameState);
    bottomCopper.setId('copper-deck-bottom');
    testHarness.addToDeck(bottomCopper);
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-deck');
    testHarness.addToDeck(estate);
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-deck');
    testHarness.addToDeck(silver);
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-deck');
    testHarness.addToDeck(gold);
    const duchy = new Duchy(testHarness.sharedGameState);
    duchy.setId('duchy-deck');
    testHarness.addToDeck(duchy);
    const drawnCopper = new Copper(testHarness.sharedGameState);
    drawnCopper.setId('copper-deck-top');
    testHarness.addToDeck(drawnCopper);

    testHarness.pickCards([duchy, estate]); // discard
    testHarness.pickCard(gold); // put back first, so Silver ends up on top
    await new Cartographer(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.hand.asCardArray().map((card) => card.getId())).toEqual(['copper-deck-top']);
    expect(testHarness.discard.size()).toBe(2);
    expect(testHarness.discard.contains(duchy)).toBe(true);
    expect(testHarness.discard.contains(estate)).toBe(true);
    expect(testHarness.deck.asCardArray().map((card) => card.getId())).toEqual([
      'copper-deck-bottom',
      'gold-deck',
      'silver-deck',
    ]);
  });

  it('puts all 4 cards back when none are discarded', async () => {
    const testHarness = createCardHarness();
    addCoppersToDeck(testHarness, 6);

    await new Cartographer(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.deck.size()).toBe(5);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('handles a deck with fewer than 4 cards left after drawing', async () => {
    const testHarness = createCardHarness();
    addCoppersToDeck(testHarness, 3);

    await new Cartographer(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.deck.size()).toBe(2);
  });

  it('only adds an action with an empty deck and discard pile', async () => {
    const testHarness = createCardHarness();

    await new Cartographer(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.deck.size()).toBe(0);
  });

  it('looks at the top 4 cards without revealing them', async () => {
    const testHarness = createCardHarness();
    addCoppersToDeck(testHarness, 5);

    await new Cartographer(testHarness.sharedGameState).play(testHarness.executor);

    const revealTriggers = vi
      .mocked(testHarness.sharedGameState.triggerEffect)
      .mock.calls.filter(([trigger]) => trigger === EffectTriggerType.REVEAL);
    expect(revealTriggers.length).toBe(0);
  });

  it('loses track of a card it looked at that has moved while the others were discarded', async () => {
    const testHarness = createCardHarness();
    const bottomCopper = new Copper(testHarness.sharedGameState);
    bottomCopper.setId('copper-deck-bottom');
    testHarness.addToDeck(bottomCopper);
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-deck');
    testHarness.addToDeck(estate);
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-deck');
    testHarness.addToDeck(silver);
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-deck');
    testHarness.addToDeck(gold);
    const duchy = new Duchy(testHarness.sharedGameState);
    duchy.setId('duchy-deck');
    testHarness.addToDeck(duchy);
    const drawnCopper = new Copper(testHarness.sharedGameState);
    drawnCopper.setId('copper-deck-top');
    testHarness.addToDeck(drawnCopper);
    const lostTrack = vi.spyOn(testHarness.executor, 'sendLostTrackMessage');
    // Something reacting to the discard moves the Silver into the hand
    const discard = testHarness.executor.discardCardsFromRevealedSet.bind(testHarness.executor);
    vi.spyOn(testHarness.executor, 'discardCardsFromRevealedSet').mockImplementation(async (cards, set) => {
      const discarded = await discard(cards, set);
      testHarness.addToHand(silver);
      return discarded;
    });

    testHarness.pickCards([duchy, estate]); // discard
    testHarness.pickCard(gold); // put back
    await new Cartographer(testHarness.sharedGameState).play(testHarness.executor);

    expect(lostTrack).toHaveBeenCalledTimes(1);
    expect(lostTrack).toHaveBeenCalledWith(silver);
    expect(testHarness.hand.asCardArray().map((card) => card.getId())).toEqual(['copper-deck-top', 'silver-deck']);
    expect(testHarness.discard.size()).toBe(2);
    expect(testHarness.deck.asCardArray().map((card) => card.getId())).toEqual(['copper-deck-bottom', 'gold-deck']);
  });
});
