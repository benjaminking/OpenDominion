import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Bishop } from '../../../src/cards/prosperity/Bishop';
import { createCardHarness } from '../testHarness';

describe('Bishop', () => {
  it('adds $1 and +1 VP, and +1 VP per $2 the trashed card costs', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    testHarness.routeOtherPlayersTo(targetHarness);
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-hand-0');
    testHarness.addToHand(gold);

    testHarness.pickCard(gold);
    await new Bishop(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(1);
    // 1 + $6 / 2
    expect(testHarness.stats.vp).toBe(4);
    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.sharedTrash.contains(gold)).toBe(true);
  });

  it('rounds the VP for the trashed card down', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    testHarness.routeOtherPlayersTo(targetHarness);
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-hand-0');
    testHarness.addToHand(silver);
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-hand-0');
    testHarness.addToHand(copper);

    testHarness.pickCard(silver);
    await new Bishop(testHarness.sharedGameState).play(testHarness.executor);

    // 1 + floor($3 / 2)
    expect(testHarness.stats.vp).toBe(2);
    expect(testHarness.hand.asCardArray().map((card) => card.getId())).toEqual(['copper-hand-0']);
  });

  it('still gives $1 and +1 VP with an empty hand', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    testHarness.routeOtherPlayersTo(targetHarness);

    await new Bishop(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(1);
    expect(testHarness.stats.vp).toBe(1);
    expect(testHarness.sharedTrash.size()).toBe(0);
  });

  it('lets each other player trash a card from their hand', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    testHarness.routeOtherPlayersTo(targetHarness);
    const targetEstate = new Estate(targetHarness.sharedGameState);
    targetEstate.setId('estate-target-hand-0');
    targetHarness.addToHand(targetEstate);
    const targetCopper = new Copper(targetHarness.sharedGameState);
    targetCopper.setId('copper-target-hand-0');
    targetHarness.addToHand(targetCopper);

    targetHarness.pickCard(targetEstate);
    await new Bishop(testHarness.sharedGameState).play(testHarness.executor);

    expect(targetHarness.hand.asCardArray().map((card) => card.getId())).toEqual(['copper-target-hand-0']);
    expect(targetHarness.sharedTrash.contains(targetEstate)).toBe(true);
    expect(targetHarness.stats.vp).toBe(0);
  });

  it('lets other players decline to trash', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    testHarness.routeOtherPlayersTo(targetHarness);
    const targetEstate = new Estate(targetHarness.sharedGameState);
    targetEstate.setId('estate-target-hand-0');
    targetHarness.addToHand(targetEstate);

    // default: choice returns none
    await new Bishop(testHarness.sharedGameState).play(testHarness.executor);

    expect(targetHarness.hand.size()).toBe(1);
    expect(targetHarness.sharedTrash.size()).toBe(0);
  });
});
