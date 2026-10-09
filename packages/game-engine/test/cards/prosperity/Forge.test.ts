import { CardChoice } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Smithy } from '../../../src/cards/base_game/Smithy';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Duchy } from '../../../src/cards/basic_cards/Duchy';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Forge } from '../../../src/cards/prosperity/Forge';
import { CardHarness, createCardHarness } from '../testHarness';

const offeredCardNames = (testHarness: CardHarness, callIndex: number): string[] =>
  ((testHarness.decisionService.chooseCard.mock.calls[callIndex] as unknown[])[3] as CardChoice[]).map(
    (choice) => choice.card.name,
  );

describe('Forge', () => {
  it('trashes any number of cards and gains a card costing exactly their total cost', async () => {
    const testHarness = createCardHarness();
    const firstEstate = new Estate(testHarness.sharedGameState);
    firstEstate.setId('estate-hand-0');
    testHarness.addToHand(firstEstate);
    const secondEstate = new Estate(testHarness.sharedGameState);
    secondEstate.setId('estate-hand-1');
    testHarness.addToHand(secondEstate);
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-hand-0');
    testHarness.addToHand(copper);
    const handSilver = new Silver(testHarness.sharedGameState);
    handSilver.setId('silver-hand-0');
    testHarness.addToHand(handSilver);
    const supplySilver = new Silver(testHarness.sharedGameState);
    supplySilver.setId('silver-supply-0');
    testHarness.addSupplyPile(supplySilver);
    const smithy = new Smithy(testHarness.sharedGameState);
    smithy.setId('smithy-supply-0');
    testHarness.addSupplyPile(smithy);
    const duchy = new Duchy(testHarness.sharedGameState);
    duchy.setId('duchy-supply-0');
    testHarness.addSupplyPile(duchy);

    testHarness.pickCards([firstEstate, secondEstate, copper]);
    testHarness.pickCard(smithy);
    await new Forge(testHarness.sharedGameState).play(testHarness.executor);

    // $2 + $2 + $0 = $4
    expect(offeredCardNames(testHarness, 0)).toEqual(['Smithy']);
    expect(testHarness.sharedTrash.size()).toBe(3);
    expect(testHarness.hand.asCardArray().map((card) => card.getId())).toEqual(['silver-hand-0']);
    expect(testHarness.discard.asCardArray().map((card) => card.getId())).toEqual(['smithy-supply-0']);
  });

  it('gains a card costing exactly $0 when nothing is trashed', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-hand-0');
    testHarness.addToHand(estate);
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-supply-0');
    testHarness.addSupplyPile(copper);
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-supply-0');
    testHarness.addSupplyPile(silver);

    // default: no cards chosen to trash
    testHarness.pickCard(copper);
    await new Forge(testHarness.sharedGameState).play(testHarness.executor);

    expect(offeredCardNames(testHarness, 0)).toEqual(['Copper']);
    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.discard.asCardArray().map((card) => card.getId())).toEqual(['copper-supply-0']);
  });
});
