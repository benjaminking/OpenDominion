import { describe, expect, it, vi } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Advisor } from '../../../src/cards/cornucopia_and_guilds/Advisor';
import { createCardHarness } from '../testHarness';

describe('Advisor', () => {
  it('gives +1 Action, discards the chosen revealed card and puts the rest into hand', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-deck-0');
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-deck-0');
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-deck-0');
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck-0');
    // Top of deck is the last card added: Copper, Silver, Gold, then Estate
    testHarness.addToDeck(estate);
    testHarness.addToDeck(gold);
    testHarness.addToDeck(silver);
    testHarness.addToDeck(copper);

    testHarness.pickCard(gold);
    await new Advisor(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.discard.asCardArray()).toEqual([gold]);
    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.hand.contains(copper)).toBe(true);
    expect(testHarness.hand.contains(silver)).toBe(true);
    expect(testHarness.deck.asCardArray()).toEqual([estate]);
  });

  it('only gives +1 Action when the deck is empty', async () => {
    const testHarness = createCardHarness();

    await new Advisor(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('lets the player to the left choose which revealed card is discarded', async () => {
    const testHarness = createCardHarness();
    const leftHarness = createCardHarness();
    vi.mocked(testHarness.sharedGameState.getPlayerLeftOfCurrent).mockReturnValue(leftHarness.player);
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-deck-0');
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-deck-0');
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck-0');
    testHarness.addToDeck(gold);
    testHarness.addToDeck(silver);
    testHarness.addToDeck(copper);

    leftHarness.pickCard(gold);
    await new Advisor(testHarness.sharedGameState).play(testHarness.executor);

    expect(leftHarness.decisionService.chooseCard).toHaveBeenCalledTimes(1);
    expect(testHarness.decisionService.chooseCard).not.toHaveBeenCalled();
    expect(testHarness.discard.asCardArray()).toEqual([gold]);
    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.hand.contains(copper)).toBe(true);
    expect(testHarness.hand.contains(silver)).toBe(true);
  });
});
