import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Vault } from '../../../src/cards/prosperity/Vault';
import { CardHarness, createCardHarness } from '../testHarness';

const addEstatesToHand = (harness: CardHarness, idPrefix: string, numEstates: number): Estate[] => {
  const estates: Estate[] = [];
  for (let cardIndex = 0; cardIndex < numEstates; cardIndex++) {
    const estate = new Estate(harness.sharedGameState);
    estate.setId(`${idPrefix}-${String(cardIndex)}`);
    harness.addToHand(estate);
    estates.push(estate);
  }
  return estates;
};

const addCoppersToDeck = (harness: CardHarness, idPrefix: string, numCoppers: number): void => {
  for (let cardIndex = 0; cardIndex < numCoppers; cardIndex++) {
    const copper = new Copper(harness.sharedGameState);
    copper.setId(`${idPrefix}-${String(cardIndex)}`);
    harness.addToDeck(copper);
  }
};

describe('Vault', () => {
  it('draws 2 cards and adds $1 per card discarded', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    testHarness.routeOtherPlayersTo(targetHarness);
    const [firstEstate, secondEstate] = addEstatesToHand(testHarness, 'estate-hand', 2);
    addCoppersToDeck(testHarness, 'copper-deck', 3);

    testHarness.pickCards([firstEstate, secondEstate]);
    await new Vault(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(2);
    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.deck.size()).toBe(1);
    expect(
      testHarness.discard
        .asCardArray()
        .map((card) => card.getId())
        .sort(),
    ).toEqual(['estate-hand-0', 'estate-hand-1']);
  });

  it('adds no coins when nothing is discarded', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    testHarness.routeOtherPlayersTo(targetHarness);
    addEstatesToHand(testHarness, 'estate-hand', 2);
    addCoppersToDeck(testHarness, 'copper-deck', 2);

    // default: no cards chosen
    await new Vault(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(0);
    expect(testHarness.hand.size()).toBe(4);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('lets each other player discard 2 cards to draw a card', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    testHarness.routeOtherPlayersTo(targetHarness);
    const [firstEstate, secondEstate] = addEstatesToHand(targetHarness, 'estate-target-hand', 3);
    addCoppersToDeck(targetHarness, 'copper-target-deck', 2);

    targetHarness.pickCards([firstEstate, secondEstate]);
    await new Vault(testHarness.sharedGameState).play(testHarness.executor);

    expect(targetHarness.hand.asCardArray().map((card) => card.getId())).toEqual([
      'estate-target-hand-2',
      'copper-target-deck-1',
    ]);
    expect(targetHarness.discard.size()).toBe(2);
    expect(targetHarness.stats.coins).toBe(0);
  });

  // BUG: only a discard of exactly 2 cards is accepted; a player with 1 card in hand can't discard it
  it('lets another player with only 1 card in hand discard it, without drawing', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    testHarness.routeOtherPlayersTo(targetHarness);
    const [targetEstate] = addEstatesToHand(targetHarness, 'estate-target-hand', 1);
    addCoppersToDeck(targetHarness, 'copper-target-deck', 2);

    targetHarness.pickCards([targetEstate]);
    await new Vault(testHarness.sharedGameState).play(testHarness.executor);

    expect(targetHarness.discard.asCardArray().map((card) => card.getId())).toEqual(['estate-target-hand-0']);
    expect(targetHarness.hand.size()).toBe(0);
    expect(targetHarness.deck.size()).toBe(2);
  });

  it('lets other players decline to discard', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    testHarness.routeOtherPlayersTo(targetHarness);
    addEstatesToHand(targetHarness, 'estate-target-hand', 3);
    addCoppersToDeck(targetHarness, 'copper-target-deck', 2);

    // default: no cards chosen
    await new Vault(testHarness.sharedGameState).play(testHarness.executor);

    expect(targetHarness.hand.size()).toBe(3);
    expect(targetHarness.deck.size()).toBe(2);
    expect(targetHarness.discard.size()).toBe(0);
  });
});
