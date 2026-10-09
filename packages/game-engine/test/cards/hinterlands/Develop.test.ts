import { describe, expect, it } from 'vitest';

import { Smithy } from '../../../src/cards/base_game/Smithy';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Develop } from '../../../src/cards/hinterlands/Develop';
import { CardHarness, createCardHarness } from '../testHarness';

const setUpSilverInHandWithNeighbouringCosts = (testHarness: CardHarness) => {
  const silver = new Silver(testHarness.sharedGameState);
  silver.setId('silver-hand-0');
  testHarness.addToHand(silver);
  const smithy = new Smithy(testHarness.sharedGameState);
  smithy.setId('smithy-supply-0');
  testHarness.addSupplyPile(smithy);
  const estate = new Estate(testHarness.sharedGameState);
  estate.setId('estate-supply-0');
  testHarness.addSupplyPile(estate);
  return { silver, smithy, estate };
};

describe('Develop', () => {
  it('trashes a card and gains cards costing $1 more and $1 less onto the deck', async () => {
    const testHarness = createCardHarness();
    const { silver, smithy, estate } = setUpSilverInHandWithNeighbouringCosts(testHarness);

    testHarness.pickCard(silver); // trash ($3)
    testHarness.pickCard(smithy); // $4
    testHarness.pickCard(estate); // $2
    await new Develop(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.sharedTrash.contains(silver)).toBe(true);
    expect(testHarness.deck.asCardArray().map((card) => card.getId())).toEqual(['smithy-supply-0', 'estate-supply-0']);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('can gain the cheaper card first', async () => {
    const testHarness = createCardHarness();
    const { silver, smithy, estate } = setUpSilverInHandWithNeighbouringCosts(testHarness);

    testHarness.pickCard(silver);
    testHarness.pickCard(estate);
    testHarness.pickCard(smithy);
    await new Develop(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.deck.asCardArray().map((card) => card.getId())).toEqual(['estate-supply-0', 'smithy-supply-0']);
  });

  it('gains only one card when nothing costs the other amount', async () => {
    const testHarness = createCardHarness();
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-hand-0');
    testHarness.addToHand(silver);
    const smithy = new Smithy(testHarness.sharedGameState);
    smithy.setId('smithy-supply-0');
    testHarness.addSupplyPile(smithy);

    testHarness.pickCard(silver);
    testHarness.pickCard(smithy);
    await new Develop(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.deck.asCardArray().map((card) => card.getId())).toEqual(['smithy-supply-0']);
  });

  it('cannot gain cards that do not cost exactly $1 more or less', async () => {
    const testHarness = createCardHarness();
    const handSilver = new Silver(testHarness.sharedGameState);
    handSilver.setId('silver-hand-0');
    testHarness.addToHand(handSilver);
    const supplySilver = new Silver(testHarness.sharedGameState);
    supplySilver.setId('silver-supply-0');
    testHarness.addSupplyPile(supplySilver);
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-supply-0');
    testHarness.addSupplyPile(gold);

    testHarness.pickCard(handSilver);
    testHarness.pickCard(gold);
    await new Develop(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.contains(handSilver)).toBe(true);
    expect(testHarness.deck.size()).toBe(0);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('does nothing with an empty hand', async () => {
    const testHarness = createCardHarness();

    await new Develop(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.deck.size()).toBe(0);
  });

  // BUG: both gain choices use allowNoneOption(), letting the player skip the mandatory gains
  it('does not offer to skip gaining when an eligible card exists', async () => {
    const testHarness = createCardHarness();
    const { silver, smithy, estate } = setUpSilverInHandWithNeighbouringCosts(testHarness);

    testHarness.pickCard(silver);
    testHarness.pickCard(smithy);
    testHarness.pickCard(estate);
    await new Develop(testHarness.sharedGameState).play(testHarness.executor);

    // chooseCard(prompt, purpose, name, choices, noneChoice): calls 1 and 2 are the two gains
    const gainNoneOptions = testHarness.decisionService.chooseCard.mock.calls
      .slice(1)
      .map((call) => (call as unknown[])[4]);
    expect(gainNoneOptions).toEqual([undefined, undefined]);
  });
});
