import { describe, expect, it, vi } from 'vitest';

import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { JackOfAllTrades } from '../../../src/cards/hinterlands/JackOfAllTrades';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { CardHarness, createCardHarness } from '../testHarness';

const addSilverPile = (testHarness: CardHarness): Silver => {
  const silver = new Silver(testHarness.sharedGameState);
  silver.setId('silver-supply-0');
  testHarness.addSupplyPile(silver);
  return silver;
};

const addCoppers = (testHarness: CardHarness, location: 'hand' | 'deck', numCoppers: number): Copper[] => {
  const coppers: Copper[] = [];
  for (let i = 0; i < numCoppers; i++) {
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId(`copper-${location}-${String(i)}`);
    if (location === 'hand') {
      testHarness.addToHand(copper);
    } else {
      testHarness.addToDeck(copper);
    }
    coppers.push(copper);
  }
  return coppers;
};

describe('JackOfAllTrades', () => {
  it('gains a Silver, may discard the top card of the deck, then draws until 5 cards in hand', async () => {
    const testHarness = createCardHarness();
    const silver = addSilverPile(testHarness);
    addCoppers(testHarness, 'deck', 4);
    const topEstate = new Estate(testHarness.sharedGameState);
    topEstate.setId('estate-deck-top');
    testHarness.addToDeck(topEstate);
    addCoppers(testHarness, 'hand', 1);

    testHarness.pickOption('Discard it');
    await new JackOfAllTrades(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(2);
    expect(testHarness.discard.contains(silver)).toBe(true);
    expect(testHarness.discard.contains(topEstate)).toBe(true);
    expect(testHarness.hand.size()).toBe(5);
    expect(testHarness.deck.size()).toBe(0);
  });

  it('can leave the top card on the deck to be drawn', async () => {
    const testHarness = createCardHarness();
    addSilverPile(testHarness);
    addCoppers(testHarness, 'deck', 4);
    const topEstate = new Estate(testHarness.sharedGameState);
    topEstate.setId('estate-deck-top');
    testHarness.addToDeck(topEstate);
    addCoppers(testHarness, 'hand', 1);

    testHarness.pickOption('Leave it on top');
    await new JackOfAllTrades(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(5);
    expect(testHarness.hand.contains(topEstate)).toBe(true);
    expect(testHarness.deck.size()).toBe(1);
    expect(testHarness.discard.size()).toBe(1);
  });

  it('does not draw when the hand already has 5 cards', async () => {
    const testHarness = createCardHarness();
    addSilverPile(testHarness);
    addCoppers(testHarness, 'deck', 2);
    addCoppers(testHarness, 'hand', 5);

    testHarness.pickOption('Leave it on top');
    await new JackOfAllTrades(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(5);
    expect(testHarness.deck.size()).toBe(2);
  });

  it('may trash a non-Treasure card from hand', async () => {
    const testHarness = createCardHarness();
    addSilverPile(testHarness);
    addCoppers(testHarness, 'deck', 1);
    addCoppers(testHarness, 'hand', 4);
    const handEstate = new Estate(testHarness.sharedGameState);
    handEstate.setId('estate-hand-0');
    testHarness.addToHand(handEstate);

    testHarness.pickOption('Leave it on top');
    testHarness.pickCard(handEstate);
    await new JackOfAllTrades(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.contains(handEstate)).toBe(true);
    expect(testHarness.hand.size()).toBe(4);
  });

  it('may choose not to trash', async () => {
    const testHarness = createCardHarness();
    addSilverPile(testHarness);
    addCoppers(testHarness, 'deck', 1);
    addCoppers(testHarness, 'hand', 4);
    const handEstate = new Estate(testHarness.sharedGameState);
    handEstate.setId('estate-hand-0');
    testHarness.addToHand(handEstate);

    testHarness.pickOption('Leave it on top');
    await new JackOfAllTrades(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.hand.size()).toBe(5);
  });

  it('cannot trash a Treasure', async () => {
    const testHarness = createCardHarness();
    addSilverPile(testHarness);
    addCoppers(testHarness, 'deck', 1);
    const handCoppers = addCoppers(testHarness, 'hand', 5);

    testHarness.pickOption('Leave it on top');
    testHarness.pickCard(handCoppers[0]);
    await new JackOfAllTrades(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.hand.size()).toBe(5);
  });

  it('looks at the top card without revealing it', async () => {
    const testHarness = createCardHarness();
    addSilverPile(testHarness);
    addCoppers(testHarness, 'deck', 1);
    addCoppers(testHarness, 'hand', 5);

    testHarness.pickOption('Leave it on top');
    await new JackOfAllTrades(testHarness.sharedGameState).play(testHarness.executor);

    const revealTriggers = vi
      .mocked(testHarness.sharedGameState.triggerEffect)
      .mock.calls.filter(([trigger]) => trigger === EffectTriggerType.REVEAL);
    expect(revealTriggers.length).toBe(0);
  });

  it('draws Action cards while drawing until 5 cards in hand', async () => {
    const testHarness = createCardHarness();
    addSilverPile(testHarness);
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-deck-top');
    testHarness.addToDeck(village);
    addCoppers(testHarness, 'hand', 4);
    // Fail fast instead of hanging if draw-until-5 keeps re-checking the same Action card
    let numActionChecks = 0;
    vi.mocked(testHarness.sharedGameState.triggerEffect).mockImplementation(async (trigger) => {
      if (trigger === EffectTriggerType.REVEALED_ACTION_DURING_DTX) {
        numActionChecks += 1;
        if (numActionChecks > 20) {
          throw new Error('draw-until-5 is stuck re-checking the same Action card');
        }
      }
    });

    testHarness.pickOption('Leave it on top');
    await new JackOfAllTrades(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.contains(village)).toBe(true);
    expect(testHarness.hand.size()).toBe(5);
  });
});
