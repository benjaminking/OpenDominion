import { describe, expect, it } from 'vitest';

import { Card } from '../../../src/card/Card';
import { ScryingPool } from '../../../src/cards/alchemy/ScryingPool';
import { Smithy } from '../../../src/cards/base_game/Smithy';
import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { CardHarness, createCardHarness } from '../testHarness';

const stackDeck = (testHarness: CardHarness, topToBottom: Card[]): void => {
  for (const card of [...topToBottom].reverse()) {
    testHarness.addToDeck(card);
  }
};

const deckIdsTopToBottom = (testHarness: CardHarness): string[] =>
  testHarness.deck
    .asCardArray()
    .map((card) => card.getId())
    .reverse();

const cardIds = (cards: Iterable<Card>): string[] => Array.from(cards, (card) => card.getId());

describe('Scrying Pool', () => {
  it('gives +1 Action', async () => {
    const testHarness = createCardHarness();

    await new ScryingPool(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
  });

  // BUG: reveals the whole deck for Actions instead of stopping at the first non-Action, and discards the non-Actions
  it('discards your own top card when chosen, then reveals into hand', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-deck');
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck');
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-deck');
    stackDeck(testHarness, [estate, copper, silver]);

    testHarness.pickOption('Discard it');
    await new ScryingPool(testHarness.sharedGameState).play(testHarness.executor);

    expect(cardIds(testHarness.discard)).toEqual([estate.getId()]);
    expect(cardIds(testHarness.hand)).toEqual([copper.getId()]);
    expect(deckIdsTopToBottom(testHarness)).toEqual(['silver-deck']);
  });

  // BUG: reveals the whole deck for Actions instead of stopping at the first non-Action, and discards the non-Actions
  it('puts your own top card back when chosen, then reveals it into hand', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck');
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-deck');
    stackDeck(testHarness, [copper, silver]);

    testHarness.pickOption('Put it back');
    await new ScryingPool(testHarness.sharedGameState).play(testHarness.executor);

    expect(cardIds(testHarness.hand)).toEqual([copper.getId()]);
    expect(deckIdsTopToBottom(testHarness)).toEqual(['silver-deck']);
    expect(testHarness.discard.size()).toBe(0);
  });

  // BUG: reveals the whole deck for Actions instead of stopping at the first non-Action, and discards the non-Actions
  it('reveals until a non-Action and puts all revealed cards into hand', async () => {
    const testHarness = createCardHarness();
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-deck');
    const smithy = new Smithy(testHarness.sharedGameState);
    smithy.setId('smithy-deck');
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck');
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-deck');
    stackDeck(testHarness, [village, smithy, copper, silver]);

    testHarness.pickOption('Put it back');
    await new ScryingPool(testHarness.sharedGameState).play(testHarness.executor);

    expect(cardIds(testHarness.hand)).toEqual([village.getId(), smithy.getId(), copper.getId()]);
    expect(deckIdsTopToBottom(testHarness)).toEqual(['silver-deck']);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('puts all revealed cards into hand when the deck runs out of Actions', async () => {
    const testHarness = createCardHarness();
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-deck');
    const smithy = new Smithy(testHarness.sharedGameState);
    smithy.setId('smithy-deck');
    stackDeck(testHarness, [village, smithy]);

    testHarness.pickOption('Put it back');
    await new ScryingPool(testHarness.sharedGameState).play(testHarness.executor);

    expect(cardIds(testHarness.hand)).toEqual([village.getId(), smithy.getId()]);
    expect(testHarness.deck.size()).toBe(0);
  });

  it("lets you discard each other player's top card when played", async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const targetEstate = new Estate(targetHarness.sharedGameState);
    targetEstate.setId('estate-target-deck');
    const targetCopper = new Copper(targetHarness.sharedGameState);
    targetCopper.setId('copper-target-deck');
    stackDeck(targetHarness, [targetEstate, targetCopper]);
    testHarness.routeAttacksTo(targetHarness);

    // Own deck is empty, so the only choice is for the target's top card
    testHarness.pickOption('Discard it');
    await new ScryingPool(testHarness.sharedGameState).play(testHarness.executor);

    expect(cardIds(targetHarness.discard)).toEqual([targetEstate.getId()]);
    expect(cardIds(targetHarness.deck)).toEqual([targetCopper.getId()]);
  });

  it("attack lets the attacker discard the target's top card", async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const targetEstate = new Estate(targetHarness.sharedGameState);
    targetEstate.setId('estate-target-deck');
    const targetCopper = new Copper(targetHarness.sharedGameState);
    targetCopper.setId('copper-target-deck');
    stackDeck(targetHarness, [targetEstate, targetCopper]);

    testHarness.pickOption('Discard it');
    await new ScryingPool(testHarness.sharedGameState).attack(targetHarness.player, testHarness.player);

    expect(cardIds(targetHarness.discard)).toEqual([targetEstate.getId()]);
    expect(cardIds(targetHarness.deck)).toEqual([targetCopper.getId()]);
    expect(targetHarness.decisionService.chooseOneOption).not.toHaveBeenCalled();
  });

  it("attack lets the attacker put the target's top card back", async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const targetEstate = new Estate(targetHarness.sharedGameState);
    targetEstate.setId('estate-target-deck');
    const targetCopper = new Copper(targetHarness.sharedGameState);
    targetCopper.setId('copper-target-deck');
    stackDeck(targetHarness, [targetEstate, targetCopper]);

    testHarness.pickOption('Put it back');
    await new ScryingPool(testHarness.sharedGameState).attack(targetHarness.player, testHarness.player);

    expect(targetHarness.discard.size()).toBe(0);
    expect(deckIdsTopToBottom(targetHarness)).toEqual(['estate-target-deck', 'copper-target-deck']);
  });

  it('attack does nothing when the target has no cards to reveal', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();

    await new ScryingPool(testHarness.sharedGameState).attack(targetHarness.player, testHarness.player);

    expect(testHarness.decisionService.chooseOneOption).not.toHaveBeenCalled();
    expect(targetHarness.discard.size()).toBe(0);
  });
});
