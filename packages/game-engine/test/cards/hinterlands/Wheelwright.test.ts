import { describe, expect, it } from 'vitest';

import { Smithy } from '../../../src/cards/base_game/Smithy';
import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Wheelwright } from '../../../src/cards/hinterlands/Wheelwright';
import { CardHarness, createCardHarness } from '../testHarness';

const addCopperToDeck = (testHarness: CardHarness): void => {
  const deckCopper = new Copper(testHarness.sharedGameState);
  deckCopper.setId('copper-deck-0');
  testHarness.addToDeck(deckCopper);
};

describe('Wheelwright', () => {
  it('draws a card and adds an action', async () => {
    const testHarness = createCardHarness();
    addCopperToDeck(testHarness);

    await new Wheelwright(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('may discard a card to gain a cheaper Action card', async () => {
    const testHarness = createCardHarness();
    addCopperToDeck(testHarness);
    const handGold = new Gold(testHarness.sharedGameState);
    handGold.setId('gold-hand-0');
    testHarness.addToHand(handGold);
    const smithy = new Smithy(testHarness.sharedGameState);
    smithy.setId('smithy-supply-0');
    testHarness.addSupplyPile(smithy);

    testHarness.pickCard(handGold);
    testHarness.pickCard(smithy);
    await new Wheelwright(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.discard.asCardArray().map((card) => card.getId())).toEqual(['gold-hand-0', 'smithy-supply-0']);
  });

  it('can gain an Action card costing exactly as much as the discarded card', async () => {
    const testHarness = createCardHarness();
    addCopperToDeck(testHarness);
    const handSilver = new Silver(testHarness.sharedGameState);
    handSilver.setId('silver-hand-0');
    testHarness.addToHand(handSilver);
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-supply-0');
    testHarness.addSupplyPile(village);

    testHarness.pickCard(handSilver);
    testHarness.pickCard(village);
    await new Wheelwright(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.contains(village)).toBe(true);
  });

  it('cannot gain a non-Action card or a more expensive Action card', async () => {
    const testHarness = createCardHarness();
    addCopperToDeck(testHarness);
    const handEstate = new Estate(testHarness.sharedGameState);
    handEstate.setId('estate-hand-0');
    testHarness.addToHand(handEstate);
    const smithy = new Smithy(testHarness.sharedGameState);
    smithy.setId('smithy-supply-0');
    testHarness.addSupplyPile(smithy);
    const supplyCopper = new Copper(testHarness.sharedGameState);
    supplyCopper.setId('copper-supply-0');
    testHarness.addSupplyPile(supplyCopper);

    testHarness.pickCard(handEstate);
    testHarness.pickCard(smithy);
    await new Wheelwright(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.asCardArray().map((card) => card.getId())).toEqual(['estate-hand-0']);
  });
});
