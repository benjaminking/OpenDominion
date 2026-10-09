import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Curse } from '../../../src/cards/basic_cards/Curse';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Soothsayer } from '../../../src/cards/cornucopia_and_guilds/Soothsayer';
import { createCardHarness } from '../testHarness';

describe('Soothsayer', () => {
  it('gains a Gold, and each other player gains a Curse and draws a card', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-supply-0');
    testHarness.addSupplyPile(gold);
    const curse = new Curse(targetHarness.sharedGameState);
    curse.setId('curse-supply-0');
    targetHarness.addSupplyPile(curse);
    const targetCopper = new Copper(targetHarness.sharedGameState);
    targetCopper.setId('copper-target-deck-0');
    targetHarness.addToDeck(targetCopper);
    testHarness.routeAttacksTo(targetHarness);

    await new Soothsayer(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.asCardArray()).toEqual([gold]);
    expect(targetHarness.discard.asCardArray()).toEqual([curse]);
    expect(targetHarness.hand.asCardArray()).toEqual([targetCopper]);
  });

  it('a player who gains no Curse does not draw', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const targetCopper = new Copper(targetHarness.sharedGameState);
    targetCopper.setId('copper-target-deck-0');
    targetHarness.addToDeck(targetCopper);
    testHarness.routeAttacksTo(targetHarness);

    await new Soothsayer(testHarness.sharedGameState).play(testHarness.executor);

    expect(targetHarness.discard.size()).toBe(0);
    expect(targetHarness.hand.size()).toBe(0);
    expect(targetHarness.deck.asCardArray()).toEqual([targetCopper]);
  });
});
