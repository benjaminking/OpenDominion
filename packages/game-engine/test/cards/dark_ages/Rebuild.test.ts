import { describe, expect, it } from 'vitest';

import { Card } from '../../../src/card/Card';
import { CardCollection } from '../../../src/card/CardCollection';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Duchy } from '../../../src/cards/basic_cards/Duchy';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Province } from '../../../src/cards/basic_cards/Province';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Rebuild } from '../../../src/cards/dark_ages/Rebuild';
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

describe('Rebuild', () => {
  it('trashes the first revealed Victory card that was not named and gains a Victory card costing up to $3 more', async () => {
    const testHarness = createCardHarness();
    const supplyEstate = withId(new Estate(testHarness.sharedGameState), 'estate-supply-0');
    const supplyProvince = withId(new Province(testHarness.sharedGameState), 'province-supply-0');
    testHarness.addSupplyPile(supplyEstate);
    testHarness.addSupplyPile(supplyProvince);
    stackDeck(testHarness, [
      withId(new Copper(testHarness.sharedGameState), 'copper-deck-0'),
      withId(new Estate(testHarness.sharedGameState), 'estate-deck-1'),
      withId(new Duchy(testHarness.sharedGameState), 'duchy-deck-2'),
      withId(new Silver(testHarness.sharedGameState), 'silver-deck-3'),
    ]);

    testHarness.pickCard(supplyEstate); // name Estate
    testHarness.pickCard(supplyProvince); // $5 Duchy + $3 = up to $8
    await new Rebuild(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(idsOf(testHarness.sharedTrash)).toEqual(['duchy-deck-2']);
    expect(idsOf(testHarness.discard)).toEqual(['copper-deck-0', 'estate-deck-1', 'province-supply-0']);
    expect(idsOf(testHarness.deck)).toEqual(['silver-deck-3']);
  });

  it('gains nothing when no Victory card costs little enough', async () => {
    const testHarness = createCardHarness();
    const supplyGold = withId(new Gold(testHarness.sharedGameState), 'gold-supply-0');
    const supplyProvince = withId(new Province(testHarness.sharedGameState), 'province-supply-0');
    testHarness.addSupplyPile(supplyGold);
    testHarness.addSupplyPile(supplyProvince);
    testHarness.addToDeck(withId(new Estate(testHarness.sharedGameState), 'estate-deck-0'));

    testHarness.pickCard(supplyGold); // name Gold
    testHarness.pickCard(supplyProvince); // $8 is more than $2 + $3
    await new Rebuild(testHarness.sharedGameState).play(testHarness.executor);

    expect(idsOf(testHarness.sharedTrash)).toEqual(['estate-deck-0']);
    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.decisionService.chooseCard).toHaveBeenCalledTimes(1);
  });

  it('discards everything revealed and trashes nothing when only the named Victory card is found', async () => {
    const testHarness = createCardHarness();
    const supplyEstate = withId(new Estate(testHarness.sharedGameState), 'estate-supply-0');
    testHarness.addSupplyPile(supplyEstate);
    stackDeck(testHarness, [
      withId(new Copper(testHarness.sharedGameState), 'copper-deck-0'),
      withId(new Estate(testHarness.sharedGameState), 'estate-deck-1'),
    ]);

    testHarness.pickCard(supplyEstate); // name Estate
    await new Rebuild(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(idsOf(testHarness.discard)).toEqual(['copper-deck-0', 'estate-deck-1']);
    expect(testHarness.deck.size()).toBe(0);
  });
});
