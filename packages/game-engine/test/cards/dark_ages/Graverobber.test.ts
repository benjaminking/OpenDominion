import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Card } from '../../../src/card/Card';
import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Province } from '../../../src/cards/basic_cards/Province';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Graverobber } from '../../../src/cards/dark_ages/Graverobber';
import { CardHarness, createCardHarness } from '../testHarness';

const GAIN_FROM_TRASH = 'Gain a card from the trash costing $3-$6 onto your deck';
const TRASH_ACTION = 'Trash an Action card from your hand and gain a card costing up to $3 more';

const putInTrash = (testHarness: CardHarness, card: Card): void => {
  testHarness.sharedTrash.addCard(card);
  card.setLocation(CardLocation.TRASH);
  testHarness.sharedCardsById.set(card.getId(), card);
};

describe('Graverobber', () => {
  it('gains a card costing $3 to $6 from the trash onto the deck', async () => {
    const testHarness = createCardHarness();
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId('copper-deck-0');
    testHarness.addToDeck(deckCopper);
    const trashedGold = new Gold(testHarness.sharedGameState);
    trashedGold.setId('gold-trash-0');
    putInTrash(testHarness, trashedGold);

    testHarness.pickOption(GAIN_FROM_TRASH);
    testHarness.pickCard(trashedGold);
    await new Graverobber(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.deck.getTopCard()).toBe(trashedGold);
    expect(testHarness.deck.size()).toBe(2);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('cannot gain a card from the trash costing less than $3 or more than $6', async () => {
    const testHarness = createCardHarness();
    const trashedCopper = new Copper(testHarness.sharedGameState);
    trashedCopper.setId('copper-trash-0');
    putInTrash(testHarness, trashedCopper);
    const trashedProvince = new Province(testHarness.sharedGameState);
    trashedProvince.setId('province-trash-0');
    putInTrash(testHarness, trashedProvince);

    testHarness.pickOption(GAIN_FROM_TRASH);
    testHarness.pickCard(trashedProvince);
    await new Graverobber(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(2);
    expect(testHarness.deck.size()).toBe(0);
  });

  it('trashes an Action card from hand and gains a card costing up to $3 more', async () => {
    const testHarness = createCardHarness();
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-hand-0');
    testHarness.addToHand(village);
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-supply-0');
    testHarness.addSupplyPile(gold);

    testHarness.pickOption(TRASH_ACTION);
    testHarness.pickCard(village);
    testHarness.pickCard(gold);
    await new Graverobber(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.sharedTrash.asCardArray()).toEqual([village]);
    expect(testHarness.discard.asCardArray()).toEqual([gold]);
  });

  it('cannot gain a card costing more than $3 more than the trashed Action', async () => {
    const testHarness = createCardHarness();
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-hand-0');
    testHarness.addToHand(village);
    const province = new Province(testHarness.sharedGameState);
    province.setId('province-supply-0');
    testHarness.addSupplyPile(province);

    testHarness.pickOption(TRASH_ACTION);
    testHarness.pickCard(village);
    testHarness.pickCard(province);
    await new Graverobber(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.asCardArray()).toEqual([village]);
    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.pileCards.get('Province')).toEqual([province]);
  });

  it('does nothing when trashing an Action is chosen but the hand has no Action card', async () => {
    const testHarness = createCardHarness();
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-hand-0');
    testHarness.addToHand(silver);
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-supply-0');
    testHarness.addSupplyPile(gold);

    testHarness.pickOption(TRASH_ACTION);
    testHarness.pickCard(silver);
    testHarness.pickCard(gold);
    await new Graverobber(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.asCardArray()).toEqual([silver]);
    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.discard.size()).toBe(0);
  });
});
